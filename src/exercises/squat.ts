import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, Phase, FormFault, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  return {
    leftKnee: angleDeg(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE], lm[POSE_LANDMARKS.LEFT_ANKLE]),
    rightKnee: angleDeg(lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE], lm[POSE_LANDMARKS.RIGHT_ANKLE]),
    leftHip: angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE]),
    rightHip: angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE]),
    torso: angleDeg(
      midpoint(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_SHOULDER]),
      midpoint(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.RIGHT_HIP]),
      { x: midpoint(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.RIGHT_HIP]).x, y: 1 }
    ),
    leftKneeValgus: angleDeg(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE], lm[POSE_LANDMARKS.LEFT_ANKLE]),
    rightKneeValgus: angleDeg(lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE], lm[POSE_LANDMARKS.RIGHT_ANKLE]),
  };
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

const squatFormChecks: FormCheck[] = [
  {
    name: "insufficient_depth",
    condition: (angles, phase) => phase === "bottom" && angles.leftKnee > 100,
    severity: "critical",
    message: "Go lower — knees should bend more at the bottom",
  },
  {
    name: "excessive_forward_knee",
    condition: (angles, phase) => (phase === "descending" || phase === "bottom") && (angles.leftHip < 70 || angles.rightHip < 70),
    severity: "warning",
    message: "Knees tracking too far forward — sit back more",
  },
  {
    name: "forward_lean",
    condition: (angles, phase) => (phase === "descending" || phase === "ascending") && angles.torso < 60,
    severity: "warning",
    message: "Keep your chest up — reduce forward lean",
  },
  {
    name: "uneven_depth",
    condition: (angles) => Math.abs(angles.leftKnee - angles.rightKnee) > 20,
    severity: "warning",
    message: "Both legs should descend equally",
  },
];

export const squatConfig: ExerciseConfig = {
  id: "squat",
  name: "Squat",
  description: "Barbell or bodyweight squat — full depth",
  category: "compound",
  primaryAngle: { joint: "knee", side: "both" },
  thresholds: { down: 110, up: 150 },
  formChecks: squatFormChecks,
  cameraView: "side",
  angleLines: [
    { from: 23, vertex: 25, to: 27, label: "L" },
    { from: 24, vertex: 26, to: 28, label: "R" },
  ],
};

export function analyzeSquat(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftKnee + angles.rightKnee) / 2;
  const faults: FormFault[] = [];

  for (const check of squatFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }

  return { angles: { ...angles, primary }, faults };
}
