import { useEffect, useRef, useState, useCallback } from "react";
import { getPoseLandmarker } from "../lib/pose";
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
    duration: number;
  }) => void;
}

export function VideoPlayer({ videoFile, exerciseId, onAnalysisComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>("idle");
  const [repCount, setRepCount] = useState(0);
  const [currentFaults, setCurrentFaults] = useState<FormFault[]>([]);
  const [landmarks, setLandmarks] = useState<Landmarks[]>([]);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  const videoUrl = URL.createObjectURL(videoFile);

  const processVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsProcessing(true);
    setProgress(0);

    const poseLandmarker = await getPoseLandmarker();
    const detector = new RepDetector(exerciseId);

    await new Promise<void>((resolve) => {
      if (video.readyState >= 1) resolve();
      else video.onloadedmetadata = () => resolve();
    });

    setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });

    const duration = video.duration;
    const fps = 30;
    const frameInterval = 1000 / fps;

    const processAllFrames = async () => {
      let currentTime = 0;

      while (currentTime < duration) {
        video.currentTime = currentTime;
        await new Promise<void>((r) => {
          video.onseeked = () => r();
        });

        const results = poseLandmarker.detectForVideo(video, performance.now());

        if (results.landmarks && results.landmarks.length > 0) {
          const lm = results.landmarks[0] as unknown as Landmarks[];
          setLandmarks(lm);

          const frameResult = detector.processFrame(lm);
          setCurrentPhase(frameResult.phase);
          setRepCount(frameResult.repCount);
          setCurrentFaults(frameResult.faults);
        }

        currentTime += frameInterval / 1000;
        setProgress((currentTime / duration) * 100);
      }

      setIsProcessing(false);
      const result = detector.getResult();
      onAnalysisComplete({
        ...result,
        videoUrl,
        duration,
      });
    };

    processAllFrames();
  }, [exerciseId, videoUrl, onAnalysisComplete]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  return (
    <div className="w-full space-y-4">
      <div className="relative bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          muted
          playsInline
          crossOrigin="anonymous"
        />
        {landmarks.length > 0 && videoDimensions.width > 0 && (
          <Skeleton
            landmarks={landmarks}
            width={videoDimensions.width}
            height={videoDimensions.height}
          />
        )}
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
