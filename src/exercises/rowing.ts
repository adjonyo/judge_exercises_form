import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, FormFault, Phase, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  const leftElbow = angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_WRIST]);
  const rightElbow = angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_WRIST]);
  const shoulder = angleDeg(lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP]);
  const torso = angleDeg(
    { x: (lm[POSE_LANDMARKS.LEFT_SHOULDER].x + lm[POSE_LANDMARKS.RIGHT_SHOULDER].x) / 2, y: (lm[POSE_LANDMARKS.LEFT_SHOULDER].y + lm[POSE_LANDMARKS.RIGHT_SHOULDER].y) / 2 },
    { x: (lm[POSE_LANDMARKS.LEFT_HIP].x + lm[POSE_LANDMARKS.RIGHT_HIP].x) / 2, y: (lm[POSE_LANDMARKS.LEFT_HIP].y + lm[POSE_LANDMARKS.RIGHT_HIP].y) / 2 },
    { x: (lm[POSE_LANDMARKS.LEFT_HIP].x + lm[POSE_LANDMARKS.RIGHT_HIP].x) / 2, y: 1 }
  );
  return { leftElbow, rightElbow, shoulder, torso };
}

const rowingFormChecks: FormCheck[] = [
  {
    name: "rounded_back",
    condition: (angles) => angles.torso < 50,
    severity: "critical",
    message: "Keep your back straight - do not round forward",
  },
  {
    name: "insufficient_pull",
    condition: (angles, phase) => phase === "top" && angles.leftElbow > 80,
    severity: "warning",
    message: "Pull the handle closer to your lower chest",
  },
  {
    name: "excessive_lean",
    condition: (angles) => angles.torso > 85,
    severity: "warning",
    message: "Lean slightly forward at the catch position",
  },
];

export const rowingConfig: ExerciseConfig = {
  id: "rowing",
  name: "Rowing",
  description: "Barbell or cable row - seated or bent-over",
  category: "compound",
  primaryAngle: { joint: "elbow", side: "both" },
  thresholds: { down: 140, up: 60 },
  formChecks: rowingFormChecks,
  cameraView: "side",
};

export function analyzeRowing(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftElbow + angles.rightElbow) / 2;
  const faults: FormFault[] = [];
  for (const check of rowingFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }
  return { angles: { ...angles, primary }, faults };
}
