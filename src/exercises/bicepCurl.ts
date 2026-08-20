import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, FormFault, Phase, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  const leftElbow = angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_WRIST]);
  const rightElbow = angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_WRIST]);
  const leftShoulder = angleDeg(lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP]);
  const rightShoulder = angleDeg(lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_HIP]);
  const torso = angleDeg(
    { x: (lm[POSE_LANDMARKS.LEFT_SHOULDER].x + lm[POSE_LANDMARKS.RIGHT_SHOULDER].x) / 2, y: (lm[POSE_LANDMARKS.LEFT_SHOULDER].y + lm[POSE_LANDMARKS.RIGHT_SHOULDER].y) / 2 },
    { x: (lm[POSE_LANDMARKS.LEFT_HIP].x + lm[POSE_LANDMARKS.RIGHT_HIP].x) / 2, y: (lm[POSE_LANDMARKS.LEFT_HIP].y + lm[POSE_LANDMARKS.RIGHT_HIP].y) / 2 },
    { x: (lm[POSE_LANDMARKS.LEFT_HIP].x + lm[POSE_LANDMARKS.RIGHT_HIP].x) / 2, y: 1 }
  );

  return { leftElbow, rightElbow, leftShoulder, rightShoulder, torso };
}

const bicepCurlFormChecks: FormCheck[] = [
  {
    name: "elbow_drift",
    condition: (angles) => angles.leftShoulder < 70 || angles.rightShoulder < 70,
    severity: "critical",
    message: "Keep elbows pinned to your sides — don't swing",
  },
  {
    name: "swinging",
    condition: (angles, phase) => (phase === "ascending" || phase === "descending") && angles.torso < 75,
    severity: "warning",
    message: "Avoid swinging your body — isolate the biceps",
  },
  {
    name: "partial_rom",
    condition: (angles, phase) => phase === "bottom" && angles.leftElbow > 160,
    severity: "warning",
    message: "Full extension at the bottom — straighten arms completely",
  },
];

export const bicepCurlConfig: ExerciseConfig = {
  id: "bicep-curl",
  name: "Bicep Curl",
  description: "Standing dumbbell or barbell bicep curl",
  category: "isolation",
  primaryAngle: { joint: "elbow", side: "both" },
  thresholds: { down: 150, up: 60 },
  formChecks: bicepCurlFormChecks,
  cameraView: "side",
  angleLines: [
    { from: 11, vertex: 13, to: 15, label: "L" },
    { from: 12, vertex: 14, to: 16, label: "R" },
  ],
};

export function analyzeBicepCurl(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftElbow + angles.rightElbow) / 2;
  const faults: FormFault[] = [];

  for (const check of bicepCurlFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }

  return { angles: { ...angles, primary }, faults };
}
