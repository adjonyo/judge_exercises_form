import { POSE_LANDMARKS } from "../lib/pose";
import type { Landmarks } from "../exercises/types";

interface Props {
  landmarks: Landmarks[];
  width: number;
  height: number;
}

const SKELETON_CONNECTIONS: [number, number][] = [
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
];

export function Skeleton({ landmarks, width, height }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 pointer-events-none"
    >
      {SKELETON_CONNECTIONS.map(([i, j], idx) => {
        const a = landmarks[i];
        const b = landmarks[j];
        if (!a || !b) return null;
        if ((a.visibility ?? 1) < 0.5 || (b.visibility ?? 1) < 0.5) return null;
        return (
          <line
            key={idx}
            x1={a.x * width}
            y1={a.y * height}
            x2={b.x * width}
            y2={b.y * height}
            stroke="#6366f1"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      {landmarks.map((lm, idx) => {
        if ((lm.visibility ?? 1) < 0.5) return null;
        return (
          <circle
            key={idx}
            cx={lm.x * width}
            cy={lm.y * height}
            r={3}
            fill={
              ([POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP] as number[]).includes(idx)
                ? "#22c55e"
                : ([POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE] as number[]).includes(idx)
                ? "#f59e0b"
                : "#6366f1"
            }
          />
        );
      })}
    </svg>
  );
}
