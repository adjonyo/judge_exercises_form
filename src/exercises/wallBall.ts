import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, FormFault, Phase, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  const leftKnee = angleDeg(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE], lm[POSE_LANDMARKS.LEFT_ANKLE]);
  const rightKnee = angleDeg(lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE], lm[POSE_LANDMARKS.RIGHT_ANKLE]);
  const leftHip = angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE]);
  const rightHip = angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE]);
  const torso = angleDeg(
    { x: (lm[POSE_LANDMARKS.LEFT_SHOULDER].x + lm[POSE_LANDMARKS.RIGHT_SHOULDER].x) / 2, y: (lm[POSE_LANDMARKS.LEFT_SHOULDER].y + lm[POSE_LANDMARKS.RIGHT_SHOULDER].y) / 2 },
    { x: (lm[POSE_LANDMARKS.LEFT_HIP].x + lm[POSE_LANDMARKS.RIGHT_HIP].x) / 2, y: (lm[POSE_LANDMARKS.LEFT_HIP].y + lm[POSE_LANDMARKS.RIGHT_HIP].y) / 2 },
    { x: (lm[POSE_LANDMARKS.LEFT_HIP].x + lm[POSE_LANDMARKS.RIGHT_HIP].x) / 2, y: 1 }
  );
  return { leftKnee, rightKnee, leftHip, rightHip, torso };
}

const wallBallFormChecks: FormCheck[] = [
  {
    name: "insufficient_depth",
    condition: (angles, phase) => phase === "bottom" && angles.leftKnee > 110,
    severity: "critical",
    message: "Go lower - hips must descend below knee level (HYROX standard)",
  },
  {
    name: "knee_cave",
    condition: (angles) => Math.abs(angles.leftKnee - angles.rightKnee) > 20,
    severity: "critical",
    message: "Keep both knees tracking over toes",
  },
  {
    name: "forward_lean",
    condition: (angles, phase) => (phase === "descending" || phase === "ascending") && angles.torso < 60,
    severity: "warning",
    message: "Keep your chest up - reduce forward lean",
  },
];

export const wallBallConfig: ExerciseConfig = {
  id: "wall-ball",
  name: "Wall Ball",
  description: "HYROX wall ball - squat to throw at target",
  category: "compound",
  primaryAngle: { joint: "knee", side: "both" },
  thresholds: { down: 110, up: 155 },
  formChecks: wallBallFormChecks,
  cameraView: "side",
  angleLines: [
    { from: 23, vertex: 25, to: 27, label: "L" },
    { from: 24, vertex: 26, to: 28, label: "R" },
  ],
};

export function analyzeWallBall(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftKnee + angles.rightKnee) / 2;
  const faults: FormFault[] = [];
  for (const check of wallBallFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }
  return { angles: { ...angles, primary }, faults };
}
