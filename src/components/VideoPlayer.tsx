import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getPoseLandmarker, POSE_LANDMARKS } from "../lib/pose";
import { RepDetector } from "../lib/repDetector";
import { Skeleton } from "./Skeleton";
import type { Landmarks, Phase, FormFault } from "../exercises/types";

interface Props {
  videoFile: File;
  exerciseId: string;
  onAnalysisComplete: (result: {
    exercise: string;
    totalReps: number;
    overallScore: number;
    reps: { repNumber: number; score: number; faults: FormFault[]; primaryAngle: number }[];
    faults: FormFault[];
    videoUrl: string;
    recordedVideoUrl: string;
    duration: number;
  }) => void;
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

const JOINT_COLORS: Record<number, string> = {
  [POSE_LANDMARKS.LEFT_SHOULDER]: "#22c55e",
  [POSE_LANDMARKS.RIGHT_SHOULDER]: "#22c55e",
  [POSE_LANDMARKS.LEFT_HIP]: "#22c55e",
  [POSE_LANDMARKS.RIGHT_HIP]: "#22c55e",
  [POSE_LANDMARKS.LEFT_KNEE]: "#f59e0b",
  [POSE_LANDMARKS.RIGHT_KNEE]: "#f59e0b",
  [POSE_LANDMARKS.LEFT_ANKLE]: "#f59e0b",
  [POSE_LANDMARKS.RIGHT_ANKLE]: "#f59e0b",
};

function drawSkeleton(ctx: CanvasRenderingContext2D, lm: Landmarks[], w: number, h: number) {
  for (const [i, j] of SKELETON_CONNECTIONS) {
    const a = lm[i];
    const b = lm[j];
    if (!a || !b) continue;
    if ((a.visibility ?? 1) < 0.5 || (b.visibility ?? 1) < 0.5) continue;
    ctx.beginPath();
    ctx.moveTo(a.x * w, a.y * h);
    ctx.lineTo(b.x * w, b.y * h);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  for (let idx = 0; idx < lm.length; idx++) {
    const pt = lm[idx];
    if ((pt.visibility ?? 1) < 0.5) continue;
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, 3, 0, Math.PI * 2);
    ctx.fillStyle = JOINT_COLORS[idx] ?? "#6366f1";
    ctx.fill();
  }
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  exerciseId: string,
  repCount: number,
  phase: Phase,
  faults: FormFault[],
  progress: number
) {
  const pad = 16;
  const fontSize = Math.max(14, w / 40);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.roundRect(pad, pad, 200, fontSize + pad * 2, 8);
  ctx.fill();
  ctx.fillStyle = "#cdd6f4";
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.fillText(exerciseId.replace(/-/g, " "), pad + 12, pad + fontSize + 4);

  const phaseLabel = phase.toUpperCase();
  const phaseColor =
    phase === "descending" || phase === "bottom"
      ? "#f59e0b"
      : phase === "ascending" || phase === "top"
      ? "#22c55e"
      : "#9ca3af";
  const phaseWidth = ctx.measureText(phaseLabel).width + 24;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.roundRect(w - pad - phaseWidth, pad, phaseWidth, fontSize + pad * 2, 8);
  ctx.fill();
  ctx.fillStyle = phaseColor;
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.fillText(phaseLabel, w - pad - phaseWidth + 12, pad + fontSize + 4);

  const repLabel = `Reps: ${repCount}`;
  const repWidth = ctx.measureText(repLabel).width + 24;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.roundRect(w - pad - phaseWidth - 12 - repWidth, pad, repWidth, fontSize + pad * 2, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(repLabel, w - pad - phaseWidth - 12 - repWidth + 12, pad + fontSize + 4);

  if (faults.length > 0) {
    const faultText = faults[0].message;
    const faultWidth = Math.min(ctx.measureText(faultText).width + 24, w * 0.6);
    const faultY = h - pad - fontSize - pad * 2;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.roundRect(pad, faultY, faultWidth, fontSize + pad * 2, 8);
    ctx.fill();
    ctx.fillStyle = faults[0].severity === "critical" ? "#ef4444" : "#f59e0b";
    ctx.font = `${fontSize - 2}px system-ui, sans-serif`;
    ctx.fillText(faultText, pad + 12, faultY + fontSize + 4);
  }

  const barY = h - 6;
  ctx.fillStyle = "#374151";
  ctx.fillRect(0, barY, w, 6);
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(0, barY, w * (progress / 100), 6);
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      video.removeEventListener("seeked", handler);
      resolve();
    };
    video.addEventListener("seeked", handler);
    video.currentTime = time;
  });
}

function tryCreateRecorder(canvas: HTMLCanvasElement): { recorder: MediaRecorder; chunks: Blob[] } | null {
  const stream = canvas.captureStream(30);
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const mimeType of types) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.start();
      return { recorder, chunks };
    }
  }
  return null;
}

export function VideoPlayer({ videoFile, exerciseId, onAnalysisComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>("idle");
  const [repCount, setRepCount] = useState(0);
  const [currentFaults, setCurrentFaults] = useState<FormFault[]>([]);
  const [landmarks, setLandmarks] = useState<Landmarks[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);

  const videoUrl = useMemo(() => URL.createObjectURL(videoFile), [videoFile]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const processVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    let poseLandmarker;
    try {
      poseLandmarker = await getPoseLandmarker();
    } catch (err) {
      console.error("Failed to load pose model:", err);
      setError("Failed to load the pose detection model. Please check your connection and try again.");
      setIsProcessing(false);
      return;
    }

    const detector = new RepDetector(exerciseId);

    await new Promise<void>((resolve, reject) => {
      if (video.readyState >= 1) {
        resolve();
      } else {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Failed to load video"));
      }
    });

    const w = video.videoWidth;
    const h = video.videoHeight;
    setVideoDimensions({ width: w, height: h });
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    const recorderResult = tryCreateRecorder(canvas);

    const duration = video.duration;
    const fps = 30;
    const frameInterval = 1000 / fps;
    let currentTime = 0;

    try {
      while (currentTime < duration) {
        await seekTo(video, currentTime);

        const results = poseLandmarker.detectForVideo(video, performance.now());

        ctx.drawImage(video, 0, 0, w, h);

        if (results.landmarks && results.landmarks.length > 0) {
          const lm = results.landmarks[0] as unknown as Landmarks[];
          setLandmarks(lm);

          const frameResult = detector.processFrame(lm);
          setCurrentPhase(frameResult.phase);
          setRepCount(frameResult.repCount);
          setCurrentFaults(frameResult.faults);

          drawSkeleton(ctx, lm, w, h);
          drawHud(ctx, w, h, exerciseId, frameResult.repCount, frameResult.phase, frameResult.faults, (currentTime / duration) * 100);
        } else {
          const pct = (currentTime / duration) * 100;
          const barY = h - 6;
          ctx.fillStyle = "#374151";
          ctx.fillRect(0, barY, w, 6);
          ctx.fillStyle = "#6366f1";
          ctx.fillRect(0, barY, w * (pct / 100), 6);
        }

        currentTime += frameInterval / 1000;
        setProgress((currentTime / duration) * 100);
      }
    } catch (err) {
      console.error("Frame processing error:", err);
    }

    if (recorderResult) {
      await new Promise<void>((resolve) => {
        const { recorder } = recorderResult;
        if (recorder.state === "inactive") {
          resolve();
        } else {
          recorder.onstop = () => resolve();
          recorder.stop();
        }
      });
    }

    const recordedVideoUrl = recorderResult
      ? URL.createObjectURL(new Blob(recorderResult.chunks, { type: "video/webm" }))
      : videoUrl;

    setIsProcessing(false);
    const result = detector.getResult();
    onAnalysisComplete({
      ...result,
      videoUrl,
      recordedVideoUrl,
      duration,
    });
  }, [exerciseId, videoUrl, onAnalysisComplete]);

  return (
    <div className="w-full space-y-4">
      <div className="relative bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          muted
          playsInline
        />
        {landmarks.length > 0 && videoDimensions.width > 0 && (
          <Skeleton
            landmarks={landmarks}
            width={videoDimensions.width}
            height={videoDimensions.height}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
        {isProcessing && (
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-300">Analyzing...</span>
                <span className="text-indigo-400 font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
        {isProcessing && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{repCount}</div>
                  <div className="text-xs text-gray-400">Reps</div>
                </div>
                <div className="text-center">
                  <div className={`text-sm font-medium px-2 py-1 rounded ${
                    currentPhase === "descending" || currentPhase === "bottom"
                      ? "bg-amber-500/20 text-amber-400"
                      : currentPhase === "ascending" || currentPhase === "top"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}>
                    {currentPhase.toUpperCase()}
                  </div>
                </div>
              </div>
              {currentFaults.length > 0 && (
                <div className="text-xs text-red-400 max-w-[200px] truncate">
                  {currentFaults[0].message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}
      {!isProcessing && (
        <button
          onClick={processVideo}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
        >
          Analyze Video
        </button>
      )}
    </div>
  );
}
