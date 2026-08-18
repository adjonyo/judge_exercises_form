import type { ExerciseConfig, Landmarks, Phase, FormFault } from "./types";
import { squatConfig, analyzeSquat } from "./squat";
import { deadliftConfig, analyzeDeadlift } from "./deadlift";
import { bicepCurlConfig, analyzeBicepCurl } from "./bicepCurl";
import { benchPressConfig, analyzeBenchPress } from "./benchPress";
import { jmPressConfig, analyzeJMPress } from "./jmPress";
import { dipsConfig, analyzeDips } from "./dips";
import { inclineCurlConfig, analyzeInclineCurl } from "./inclineCurl";
import { rowingConfig, analyzeRowing } from "./rowing";
import { lungeConfig, analyzeLunge } from "./lunge";
import { bulgarianSplitSquatConfig, analyzeBulgarianSplitSquat } from "./bulgarianSplitSquat";
import { wallBallConfig, analyzeWallBall } from "./wallBall";

export const EXERCISES: ExerciseConfig[] = [
  squatConfig,
  wallBallConfig,
  deadliftConfig,
  benchPressConfig,
  bicepCurlConfig,
  inclineCurlConfig,
  jmPressConfig,
  dipsConfig,
  rowingConfig,
  lungeConfig,
  bulgarianSplitSquatConfig,
];

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export type AnalyzerFn = (lm: Landmarks[], phase: Phase) => { angles: Record<string, number>; faults: FormFault[] };

const analyzers: Record<string, AnalyzerFn> = {
  squat: analyzeSquat,
  "wall-ball": analyzeWallBall,
  deadlift: analyzeDeadlift,
  "bench-press": analyzeBenchPress,
  "bicep-curl": analyzeBicepCurl,
  "incline-curl": analyzeInclineCurl,
  "jm-press": analyzeJMPress,
  dips: analyzeDips,
  rowing: analyzeRowing,
  lunge: analyzeLunge,
  "bulgarian-split-squat": analyzeBulgarianSplitSquat,
};

export function analyzeFrame(exerciseId: string, lm: Landmarks[], phase: Phase): { angles: Record<string, number>; faults: FormFault[] } {
  const analyzer = analyzers[exerciseId];
  if (!analyzer) throw new Error(`No analyzer for exercise: ${exerciseId}`);
  return analyzer(lm, phase);
}
