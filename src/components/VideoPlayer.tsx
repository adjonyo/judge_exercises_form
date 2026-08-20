import { useRef, useState, useCallback, useMemo } from "react";
import { getPoseLandmarker } from "../lib/pose";
import { RepDetector } from "../lib/repDetector";
import { Skeleton } from "./Skeleton";
import { getExerciseById } from "../exercises";
import type { Landmarks, Phase, FormFault, AngleLine } from "../exercises/types";

interface Props {
  videoFile: File;
  exerciseId: string;
  onAnalysisComplete: (result: {
    exercise: string;
    totalReps: number;
    goodReps: number;
    badReps: number;
    overallScore: number;
    reps: { repNumber: number; score: number; faults: FormFault[]; primaryAngle: number; isGood: boolean }[];
    faults: FormFault[];
    videoUrl: string;
    recordedVideoUrl: string;
    recordedVideoMime: string;
    duration: number;
  }) => void;
}

const LINE_COLORS = ["#22c55e", "#f59e0b"];

function drawAngleLines(
  ctx: CanvasRenderingContext2D,
  lm: Landmarks[],
  w: number,
  h: number,
  angleLines: AngleLine[],
  primaryAngle: number,
  phase: Phase
) {
    const fontSize = Math.max(12, w / 50);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < angleLines.length; i++) {
      const line = angleLines[i];
      const from = lm[line.from];
      const vertex = lm[line.vertex];
      const to = lm[line.to];
      if (!from || !vertex || !to) continue;
      if ((from.visibility ?? 1) < 0.3 || (vertex.visibility ?? 1) < 0.3 || (to.visibility ?? 1) < 0.3) continue;

      const fx = from.x * w, fy = from.y * h;
      const vx = vertex.x * w, vy = vertex.y * h;
      const tx = to.x * w, ty = to.y * h;

      const color = LINE_COLORS[i % LINE_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(vx, vy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(3, w / 200);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(vx, vy, Math.max(5, w / 120), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      const midX = (fx + tx) / 2;
      const midY = (fy + ty) / 2;
      const labelX = vx + (vx - midX) * 0.3;
      const labelY = vy + (vy - midY) * 0.3;

      const angleText = `${Math.round(primaryAngle)}°`;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      const tw = ctx.measureText(angleText).width;

      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.roundRect(labelX - tw / 2 - 4, labelY - fontSize / 2 - 2, tw + 8, fontSize + 4, 4);
      ctx.fill();

      const hasFault = phase === "bottom";
      ctx.fillStyle = hasFault ? "#ef4444" : color;
      ctx.fillText(angleText, labelX, labelY);
    }
}

function drawHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  exerciseId: string,
  goodReps: number,
  badReps: number,
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

  const repLabel = `${goodReps}✓  ${badReps}✗`;
  const repWidth = ctx.measureText(repLabel).width + 24;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.roundRect(w - pad - phaseWidth - 12 - repWidth, pad, repWidth, fontSize + pad * 2, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
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
  return new Promise((resolve, reject) => {
    const clampedTime = Math.min(time, video.duration);
    if (Math.abs(video.currentTime - clampedTime) < 0.01) {
      resolve();
      return;
    }
    const timeout = setTimeout(() => {
      clearInterval(poll);
      video.removeEventListener("seeked", onSeeked);
      reject(new Error(`Seek timeout at ${clampedTime}s`));
    }, 5000);
    const onSeeked = () => {
      clearTimeout(timeout);
      clearInterval(poll);
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = clampedTime;
    const poll = setInterval(() => {
      if (Math.abs(video.currentTime - clampedTime) < 0.1) {
        clearTimeout(timeout);
        clearInterval(poll);
        video.removeEventListener("seeked", onSeeked);
        resolve();
      }
    }, 200);
  });
}

function canOpenWebM(): boolean {
  const v = document.createElement("video");
  return v.canPlayType("video/webm") !== "";
}

function tryCreateRecorder(canvas: HTMLCanvasElement): { recorder: MediaRecorder; chunks: Blob[]; mimeType: string } | null {
  try {
    const stream = canvas.captureStream(30);
    const types = [
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    for (const mimeType of types) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        if (mimeType.startsWith("video/webm") && !canOpenWebM()) {
          console.warn(`[Recorder] ${mimeType} supported for recording but this browser cannot play WebM — skipping`);
          return null;
        }
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 8_000_000,
        });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.start();
        return { recorder, chunks, mimeType };
      }
    }
  } catch (err) {
    console.warn("Could not create MediaRecorder:", err);
  }
  return null;
}

export function VideoPlayer({ videoFile, exerciseId, onAnalysisComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  const [currentPhase, setCurrentPhase] = useState<Phase>("idle");
  const [repCount, setRepCount] = useState(0);
  const [goodReps, setGoodReps] = useState(0);
  const [badReps, setBadReps] = useState(0);
  const [currentFaults, setCurrentFaults] = useState<FormFault[]>([]);
  const [landmarks, setLandmarks] = useState<Landmarks[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);

  const videoUrl = useMemo(() => URL.createObjectURL(videoFile), [videoFile]);

  const processVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      console.error("VideoPlayer refs not available");
      return;
    }

    const exerciseConfig = getExerciseById(exerciseId);
    const angleLines = exerciseConfig?.angleLines ?? [];

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setProcessingStage("Loading pose detection model...");

    try {
      console.log("[Analysis] Starting...");
      console.log("[Analysis] Video src:", video.src?.substring(0, 60));
      console.log("[Analysis] Video readyState:", video.readyState);

      let poseLandmarker;
      try {
        console.log("[Analysis] Loading pose model...");
        poseLandmarker = await getPoseLandmarker();
        console.log("[Analysis] Pose model loaded successfully");
      } catch (err) {
        console.error("[Analysis] Failed to load pose model:", err);
        setError("Failed to load the pose detection model. Please check your connection and try again.");
        setIsProcessing(false);
        return;
      }

      setProcessingStage("Preparing video...");

      const detector = new RepDetector(exerciseId);
      console.log("[Analysis] RepDetector created for:", exerciseId);

      if (video.readyState < 1) {
        console.log("[Analysis] Waiting for video metadata...");
        console.log("[Analysis] readyState:", video.readyState, "networkState:", video.networkState);

        video.load();

        await new Promise<void>((resolve, reject) => {
          if (video.readyState >= 2) { resolve(); return; }

          const timeout = setTimeout(() => {
            cleanup();
            clearInterval(poll);
            reject(new Error(`Video metadata load timed out (readyState=${video.readyState}, networkState=${video.networkState})`));
          }, 30000);
          const onData = () => { clearTimeout(timeout); cleanup(); clearInterval(poll); resolve(); };
          const onErr = () => { clearTimeout(timeout); cleanup(); clearInterval(poll); reject(new Error("Failed to load video")); };
          const cleanup = () => {
            video.removeEventListener("loadeddata", onData);
            video.removeEventListener("loadedmetadata", onData);
            video.removeEventListener("canplay", onData);
            video.removeEventListener("error", onErr);
          };
          video.addEventListener("loadeddata", onData);
          video.addEventListener("loadedmetadata", onData);
          video.addEventListener("canplay", onData);
          video.addEventListener("error", onErr);
          const poll = setInterval(() => {
            console.log("[Analysis] Polling readyState:", video.readyState);
            if (video.readyState >= 2) {
              clearTimeout(timeout);
              cleanup();
              clearInterval(poll);
              resolve();
            }
          }, 300);
        });
      }

      const w = video.videoWidth;
      const h = video.videoHeight;
      console.log("[Analysis] Video dimensions:", w, "x", h);
      console.log("[Analysis] Video duration:", video.duration, "readyState:", video.readyState);

      if (!w || !h) {
        setError("Could not read video dimensions. The file may be corrupt.");
        setIsProcessing(false);
        return;
      }

      if (!isFinite(video.duration) || video.duration <= 0) {
        setError("Could not determine video duration. Try a different video file.");
        setIsProcessing(false);
        return;
      }

      setVideoDimensions({ width: w, height: h });
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Could not get canvas rendering context.");
        setIsProcessing(false);
        return;
      }

      setProcessingStage("Setting up recording...");

      let recorderResult: { recorder: MediaRecorder; chunks: Blob[]; mimeType: string } | null = null;
      try {
        recorderResult = tryCreateRecorder(canvas);
        console.log("[Analysis] Recorder created:", !!recorderResult);
      } catch (err) {
        console.warn("[Analysis] Recorder creation failed (continuing without recording):", err);
      }

      const duration = video.duration;
      const fps = 10;
      const frameInterval = 1 / fps;
      let currentTime = 0;
      let frameCount = 0;
      const totalFrames = Math.ceil(duration * fps);

      setProcessingStage("Analyzing frames...");
      console.log(`[Analysis] Starting loop: ${totalFrames} frames, duration: ${duration.toFixed(2)}s`);

      while (currentTime < duration) {
        try {
          await seekTo(video, currentTime);
        } catch (seekErr) {
          console.warn("[Analysis] Seek failed, skipping frame:", seekErr);
          currentTime += frameInterval;
          continue;
        }

        try {
          const results = poseLandmarker.detectForVideo(video, performance.now());

          ctx.drawImage(video, 0, 0, w, h);

          if (results.landmarks && results.landmarks.length > 0) {
            const lm = results.landmarks[0] as unknown as Landmarks[];
            setLandmarks(lm);

            const frameResult = detector.processFrame(lm);
            setCurrentPhase(frameResult.phase);
            setRepCount(frameResult.repCount);
            setCurrentFaults(frameResult.faults);

            const result = detector.getResult();
            setGoodReps(result.goodReps);
            setBadReps(result.badReps);

            drawAngleLines(ctx, lm, w, h, angleLines, frameResult.angles.primary, frameResult.phase);
            drawHud(ctx, w, h, exerciseId, result.goodReps, result.badReps, frameResult.phase, frameResult.faults, ((frameCount + 1) / totalFrames) * 100);
          } else {
            const pct = ((frameCount + 1) / totalFrames) * 100;
            const barY = h - 6;
            ctx.fillStyle = "#374151";
            ctx.fillRect(0, barY, w, 6);
            ctx.fillStyle = "#6366f1";
            ctx.fillRect(0, barY, w * (pct / 100), 6);
          }
        } catch (frameErr) {
          console.error("[Analysis] Frame processing error:", frameErr);
        }

        frameCount++;
        setProgress((frameCount / totalFrames) * 100);

        currentTime += frameInterval;
        await new Promise<void>((r) => setTimeout(r, 0));
      }

      console.log(`[Analysis] Loop complete. Processed ${frameCount} frames.`);

      setProcessingStage("Finalizing...");

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
        ? URL.createObjectURL(new Blob(recorderResult.chunks, { type: recorderResult.mimeType }))
        : videoUrl;

      const recordedVideoMime = recorderResult?.mimeType ?? (videoFile.type || "video/webm");

      console.log("[Analysis] Recorder mimeType:", recorderResult?.mimeType ?? "null (using original)");
      console.log("[Analysis] Download MIME:", recordedVideoMime);

      console.log("[Analysis] Complete! Reps:", detector.getResult().totalReps);

      setIsProcessing(false);
      setProcessingStage("");
      const result = detector.getResult();
      onAnalysisComplete({
        ...result,
        videoUrl,
        recordedVideoUrl,
        recordedVideoMime,
        duration,
      });
    } catch (err) {
      console.error("[Analysis] Fatal error:", err);
      setError(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsProcessing(false);
      setProcessingStage("");
    }
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
                <span className="text-gray-300">{processingStage || "Analyzing..."}</span>
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
                <div className="flex gap-2 text-xs">
                  <span className="text-green-400">{goodReps}✓</span>
                  <span className="text-red-400">{badReps}✗</span>
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
