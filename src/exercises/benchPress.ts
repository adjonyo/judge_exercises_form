import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, FormFault, Phase, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  const leftElbow = angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_WRIST]);
  const rightElbow = angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_WRIST]);
  const shoulder = angleDeg(lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP]);

  return { leftElbow, rightElbow, shoulder };
}

const benchPressFormChecks: FormCheck[] = [
  {
    name: "elbow_flare",
    condition: (angles) => angles.shoulder < 45,
    severity: "critical",
    message: "Don't flare elbows too wide — tuck at ~45°",
  },
  {
    name: "insufficient_depth",
    condition: (angles, phase) => phase === "bottom" && angles.leftElbow > 110,
    severity: "warning",
    message: "Bring the bar lower to your chest",
  },
  {
    name: "partial_lockout",
    condition: (angles, phase) => phase === "top" && angles.leftElbow > 50,
    severity: "warning",
    message: "Full lockout at the top — extend arms fully",
  },
];

export const benchPressConfig: ExerciseConfig = {
  id: "bench-press",
  name: "Bench Press",
  description: "Barbell bench press — flat bench",
  category: "compound",
  primaryAngle: { joint: "elbow", side: "both" },
  thresholds: { down: 100, up: 50 },
  formChecks: benchPressFormChecks,
  cameraView: "side",
  reversed: true,
  angleLines: [
    { from: 11, vertex: 13, to: 15, label: "L" },
    { from: 12, vertex: 14, to: 16, label: "R" },
  ],
};

export function analyzeBenchPress(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftElbow + angles.rightElbow) / 2;
  const faults: FormFault[] = [];

  for (const check of benchPressFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }

  return { angles: { ...angles, primary }, faults };
}
