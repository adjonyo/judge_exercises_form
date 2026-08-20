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
  private restAngle = 0;
  private reversed = false;

  constructor(exerciseId: string) {
    this.exerciseId = exerciseId;
    const config = getExerciseById(exerciseId);
    if (!config) throw new Error(`Unknown exercise: ${exerciseId}`);
    this.config = config;
    this.reversed = config.reversed ?? false;
  }

  processFrame(landmarks: Landmarks[]): { phase: Phase; repCount: number; angles: Record<string, number>; faults: FormFault[] } {
    const { angles, faults } = analyzeFrame(this.exerciseId, landmarks, this.phase);
    const rawAngle = angles.primary;

    this.smoothedAngle = this.smoothedAngle === 0 ? rawAngle : this.smoothedAngle * 0.7 + rawAngle * 0.3;
    this.primaryAngle = this.smoothedAngle;

    this.currentRepFaults.push(...faults);

    const { down, up } = this.config.thresholds;
    const angle = this.primaryAngle;

    if (this.phase === "idle" || this.phase === "top") {
      if (this.restAngle === 0) this.restAngle = angle;

      if (!this.reversed) {
        if (angle < this.restAngle - 15) {
          this.phase = "descending";
          this.restAngle = 0;
        }
      } else {
        if (angle > this.restAngle + 15) {
          this.phase = "descending";
          this.restAngle = 0;
        }
      }
    } else if (this.phase === "descending") {
      if (!this.reversed) {
        if (angle < down - 10) {
          this.phase = "bottom";
        } else if (angle > up) {
          this.phase = "top";
        }
      } else {
        if (angle > down + 10) {
          this.phase = "bottom";
        } else if (angle < up) {
          this.phase = "top";
        }
      }
    } else if (this.phase === "bottom") {
      if (!this.reversed) {
        if (angle > down) {
          this.phase = "ascending";
        }
      } else {
        if (angle < down) {
          this.phase = "ascending";
        }
      }
    } else if (this.phase === "ascending") {
      if (!this.reversed) {
        if (angle > up) {
          this.phase = "top";
          this.completeRep();
        } else if (angle < down - 10) {
          this.phase = "bottom";
        }
      } else {
        if (angle < up) {
          this.phase = "top";
          this.completeRep();
        } else if (angle > down + 10) {
          this.phase = "bottom";
        }
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
    const uniqueFaults = [...new Map(this.currentRepFaults.map((f) => [f.name, f])).values()];
    const hasCritical = uniqueFaults.some((f) => f.severity === "critical");
    const score = Math.max(0, 100 - uniqueFaults.filter((f) => f.severity === "critical").length * 20 - uniqueFaults.filter((f) => f.severity === "warning").length * 5);

    this.reps.push({
      repNumber: this.repCount,
      score,
      faults: [...uniqueFaults],
      primaryAngle: this.primaryAngle,
      phase: this.phase,
      isGood: !hasCritical,
    });

    this.currentRepFaults = [];
  }

  getResult(): AnalysisResult {
    const config = getExerciseById(this.exerciseId)!;
    const allFaults = this.reps.flatMap((r) => r.faults);
    const goodReps = this.reps.filter((r) => r.isGood).length;
    const badReps = this.reps.length - goodReps;
    const overallScore = this.reps.length > 0 ? Math.round(this.reps.reduce((sum, r) => sum + r.score, 0) / this.reps.length) : 100;

    return {
      exercise: config.name,
      totalReps: this.repCount,
      goodReps,
      badReps,
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
