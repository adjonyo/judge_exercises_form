export type Phase = "idle" | "descending" | "bottom" | "ascending" | "top";

export interface FormFault {
  name: string;
  severity: "warning" | "critical";
  message: string;
}

export interface RepResult {
  repNumber: number;
  score: number;
  faults: FormFault[];
  primaryAngle: number;
  phase: Phase;
  isGood: boolean;
}

export interface AnalysisResult {
  exercise: string;
  totalReps: number;
  goodReps: number;
  badReps: number;
  overallScore: number;
  reps: RepResult[];
  faults: FormFault[];
}

export interface AngleLine {
  from: number;
  vertex: number;
  to: number;
  label: string;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  category: "compound" | "isolation";
  primaryAngle: {
    joint: "knee" | "hip" | "elbow" | "shoulder";
    side: "left" | "right" | "both";
  };
  thresholds: {
    down: number;
    up: number;
  };
  formChecks: FormCheck[];
  cameraView: "side" | "front" | "either";
  reversed?: boolean;
  angleLines: AngleLine[];
}

export interface FormCheck {
  name: string;
  condition: (angles: Record<string, number>, phase: Phase) => boolean;
  severity: "warning" | "critical";
  message: string;
}

export interface Landmarks {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
