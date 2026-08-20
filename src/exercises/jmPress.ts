import { angleDeg } from "../lib/geometry";
import { POSE_LANDMARKS } from "../lib/pose";
import type { ExerciseConfig, FormCheck, FormFault, Phase, Landmarks } from "./types";

function getAngles(lm: Landmarks[]) {
  const leftElbow = angleDeg(lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_WRIST]);
  const rightElbow = angleDeg(lm[POSE_LANDMARKS.RIGHT_SHOULDER], lm[POSE_LANDMARKS.RIGHT_ELBOW], lm[POSE_LANDMARKS.RIGHT_WRIST]);
  const shoulder = angleDeg(lm[POSE_LANDMARKS.LEFT_ELBOW], lm[POSE_LANDMARKS.LEFT_SHOULDER], lm[POSE_LANDMARKS.LEFT_HIP]);
  return { leftElbow, rightElbow, shoulder };
}

const jmPressFormChecks: FormCheck[] = [
  {
    name: "elbow_flare",
    condition: (angles) => angles.shoulder < 40,
    severity: "critical",
    message: "Keep elbows tucked in - do not let them flare out",
  },
  {
    name: "partial_rom",
    condition: (angles, phase) => phase === "bottom" && angles.leftElbow > 90,
    severity: "warning",
    message: "Lower the bar further toward your forehead",
  },
  {
    name: "incomplete_lockout",
    condition: (angles, phase) => phase === "top" && angles.leftElbow > 40,
    severity: "warning",
    message: "Full lockout - extend arms completely",
  },
];

export const jmPressConfig: ExerciseConfig = {
  id: "jm-press",
  name: "JM Triceps Press",
  description: "JM press - hybrid bench/triceps movement",
  category: "compound",
  primaryAngle: { joint: "elbow", side: "both" },
  thresholds: { down: 80, up: 40 },
  formChecks: jmPressFormChecks,
  cameraView: "side",
  reversed: true,
  angleLines: [
    { from: 11, vertex: 13, to: 15, label: "L" },
    { from: 12, vertex: 14, to: 16, label: "R" },
  ],
};

export function analyzeJMPress(lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const angles = getAngles(lm);
  const primary = (angles.leftElbow + angles.rightElbow) / 2;
  const faults: FormFault[] = [];
  for (const check of jmPressFormChecks) {
    if (check.condition(angles, phase)) {
      faults.push({ name: check.name, severity: check.severity, message: check.message });
    }
  }
  return { angles: { ...angles, primary }, faults };
}
