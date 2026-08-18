import { getExerciseById, analyzeFrame } from "../exercises";
import type { Phase, RepResult, FormFault, AnalysisResult, Landmarks } from "../exercises/types";

export class RepDetector {
  private exerciseId: string;
  private config;
  private phase: Phase = "idle";
  private repCount = 0;
  private currentRepFaults: FormFault[] = [];
  private primaryAngle = 0;
  private smoothedAngle = 0;
  private reps: RepResult[] = [];

  constructor(exerciseId: string) {
    this.exerciseId = exerciseId;
    const config = getExerciseById(exerciseId);
    if (!config) throw new Error(`Unknown exercise: ${exerciseId}`);
    this.config = config;
  }

  processFrame(landmarks: Landmarks[]): { phase: Phase; repCount: number; angles: Record<string, number>; faults: FormFault[] } {
    const { angles, faults } = analyzeFrame(this.exerciseId, landmarks, this.phase);
    const rawAngle = angles.primary;

    this.smoothedAngle = this.smoothedAngle === 0 ? rawAngle : this.smoothedAngle * 0.7 + rawAngle * 0.3;
    this.primaryAngle = this.smoothedAngle;

    this.currentRepFaults.push(...faults);

    const { down, up } = this.config.thresholds;

    if (this.phase === "idle" || this.phase === "top") {
      if (this.primaryAngle < down) {
        this.phase = "descending";
      }
    } else if (this.phase === "descending") {
      if (this.primaryAngle < down - 10) {
        this.phase = "bottom";
      } else if (this.primaryAngle > up) {
        this.phase = "top";
      }
    } else if (this.phase === "bottom") {
      if (this.primaryAngle > down) {
        this.phase = "ascending";
      }
    } else if (this.phase === "ascending") {
      if (this.primaryAngle > up) {
        this.phase = "top";
        this.completeRep();
      } else if (this.primaryAngle < down - 10) {
        this.phase = "bottom";
      }
    }

    return {
      phase: this.phase,
      repCount: this.repCount,
      angles,
      faults,
    };
  }

  private completeRep() {
    this.repCount++;
    const score = Math.max(0, 100 - this.currentRepFaults.filter((f) => f.severity === "critical").length * 20 - this.currentRepFaults.filter((f) => f.severity === "warning").length * 5);

    this.reps.push({
      repNumber: this.repCount,
      score,
      faults: [...this.currentRepFaults],
      primaryAngle: this.primaryAngle,
      phase: this.phase,
    });

    this.currentRepFaults = [];
  }

  getResult(): AnalysisResult {
    const config = getExerciseById(this.exerciseId)!;
    const allFaults = this.reps.flatMap((r) => r.faults);
    const overallScore = this.reps.length > 0 ? Math.round(this.reps.reduce((sum, r) => sum + r.score, 0) / this.reps.length) : 100;

    return {
      exercise: config.name,
      totalReps: this.repCount,
      overallScore,
      reps: this.reps,
      faults: allFaults,
    };
  }

  getPhase(): Phase {
    return this.phase;
  }

  getRepCount(): number {
    return this.repCount;
  }
}
