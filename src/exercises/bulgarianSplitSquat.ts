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

const bulgarianSplitSquatFormChecks: FormCheck[] = [
  {
    name: "knee_cave",
    condition: (angles, phase) => phase === "bottom" && (angles.leftKnee < 80 || angles.rightKnee < 80),
    severity: "critical",
    message: "Front knee should track over toes - do not let it cave inward",
  },
  {
    name: "insufficient_depth",
    condition: (angles, phase) => phase === "bottom" && angles.leftKnee > 100,
    severity: "warning",
    message: "Go deeper - back knee should approach the floor",
  },
  {
    name: "forward_lean",
    condition: (angles) => angles.torso < 55,
    severity: "warning",
    message: "Keep your chest up and torso more upright",
  },
  {
    name: "hip_shift",
    condition: (angles) => Math.abs(angles.leftHip - angles.rightHip) > 25,
    severity: "warning",
    message: "Keep hips square - avoid shifting to one side",
  },
];

export const bulgarianSplitSquatConfig: ExerciseConfig = {
  id: "bulgarian-split-squat",
  name: "Bulgarian Split Squat",
  description: "Rear-foot elevated split squat",
  category: "compound",
  primaryAngle: { joint: "knee", side: "both" },
  thresholds: { down: 100, up: 155 },
  formChecks: bulgarianSplitSquatFormChecks,
  cameraView: "side",
};

export function analyzeBulgarianSplitSquat(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftKnee + angles.rightKnee) / 2;
  const faults: FormFault[] = [];
  for (const check of bulgarianSplitSquatFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }
  return { angles: { ...angles, primary }, faults };
}
