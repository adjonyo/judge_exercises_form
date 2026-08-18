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

const dipsFormChecks: FormCheck[] = [
  {
    name: "insufficient_depth",
    condition: (angles, phase) => phase === "bottom" && angles.leftElbow > 100,
    severity: "warning",
    message: "Go lower — upper arms should be at least parallel to the floor",
  },
  {
    name: "excessive_lean",
    condition: (angles) => angles.torso < 50,
    severity: "warning",
    message: "Avoid leaning too far forward — keep torso more upright",
  },
  {
    name: "partial_extension",
    condition: (angles, phase) => phase === "top" && angles.leftElbow > 50,
    severity: "warning",
    message: "Full extension at the top — lock out your arms",
  },
];

export const dipsConfig: ExerciseConfig = {
  id: "dips",
  name: "Dips",
  description: "Parallel bar dips — chest or triceps focus",
  category: "compound",
  primaryAngle: { joint: "elbow", side: "both" },
  thresholds: { down: 100, up: 50 },
  formChecks: dipsFormChecks,
  cameraView: "side",
};

export function analyzeDips(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftElbow + angles.rightElbow) / 2;
  const faults: FormFault[] = [];

  for (const check of dipsFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }

  return { angles: { ...angles, primary }, faults };
}
