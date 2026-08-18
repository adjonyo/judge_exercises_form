import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, FormFault, Phase, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  const leftHip = angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE]);
  const rightHip = angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE]);
  const leftKnee = angleDeg(lm[POSE_LANDMARKS.LEFT_HIP], lm[POSE_LANDMARKS.LEFT_KNEE], lm[POSE_LANDMARKS.LEFT_ANKLE]);
  const rightKnee = angleDeg(lm[POSE_LANDMARKS.RIGHT_HIP], lm[POSE_LANDMARKS.RIGHT_KNEE], lm[POSE_LANDMARKS.RIGHT_ANKLE]);
  const shoulder = angleDeg(
    lm[POSE_LANDMARKS.LEFT_ELBOW],
    lm[POSE_LANDMARKS.LEFT_SHOULDER],
    lm[POSE_LANDMARKS.LEFT_HIP]
  );

  return { leftHip, rightHip, leftKnee, rightKnee, shoulder };
}

const deadliftFormChecks: FormCheck[] = [
  {
    name: "rounded_back",
    condition: (angles) => angles.shoulder < 140,
    severity: "critical",
    message: "Keep your back straight — avoid rounding",
  },
  {
    name: "insufficient_hip_hinge",
    condition: (angles, phase) => phase === "bottom" && angles.leftHip > 120,
    severity: "warning",
    message: "Hinge more at the hips",
  },
  {
    name: "excessive_knee_bend",
    condition: (angles) => angles.leftKnee < 100,
    severity: "warning",
    message: "This looks more like a squat — keep shins more vertical",
  },
];

export const deadliftConfig: ExerciseConfig = {
  id: "deadlift",
  name: "Deadlift",
  description: "Conventional or Romanian deadlift",
  category: "compound",
  primaryAngle: { joint: "hip", side: "both" },
  thresholds: { down: 100, up: 150 },
  formChecks: deadliftFormChecks,
  cameraView: "side",
};

export function analyzeDeadlift(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftHip + angles.rightHip) / 2;
  const faults: FormFault[] = [];

  for (const check of deadliftFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }

  return { angles: { ...angles, primary }, faults };
}
