import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, FormFault, Phase, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  const leftElbow = angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_WRIST]);
  const rightElbow = angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_WRIST]);
  const leftShoulder = angleDeg(lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP]);
  const rightShoulder = angleDeg(lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_HIP]);
  return { leftElbow, rightElbow, leftShoulder, rightShoulder };
}

const inclineCurlFormChecks: FormCheck[] = [
  {
    name: "elbow_drift",
    condition: (angles) => angles.leftShoulder < 65 || angles.rightShoulder < 65,
    severity: "critical",
    message: "Keep elbows back against the bench - do not swing forward",
  },
  {
    name: "partial_rom",
    condition: (angles, phase) => phase === "bottom" && angles.leftElbow > 160,
    severity: "warning",
    message: "Full extension at the bottom",
  },
  {
    name: "incomplete_curl",
    condition: (angles, phase) => phase === "top" && angles.leftElbow > 80,
    severity: "warning",
    message: "Curl higher - bring the weight closer to your shoulder",
  },
];

export const inclineCurlConfig: ExerciseConfig = {
  id: "incline-curl",
  name: "Incline Bicep Curl",
  description: "Seated incline bench dumbbell bicep curl",
  category: "isolation",
  primaryAngle: { joint: "elbow", side: "both" },
  thresholds: { down: 150, up: 60 },
  formChecks: inclineCurlFormChecks,
  cameraView: "side",
  angleLines: [
    { from: 11, vertex: 13, to: 15, label: "L" },
    { from: 12, vertex: 14, to: 16, label: "R" },
  ],
};

export function analyzeInclineCurl(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftElbow + angles.rightElbow) / 2;
  const faults: FormFault[] = [];
  for (const check of inclineCurlFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }
  return { angles: { ...angles, primary }, faults };
}
