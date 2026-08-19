import { useState } from "react";
import { ExerciseSelector } from "./components/ExerciseSelector";
import { VideoUpload } from "./components/VideoUpload";
import { VideoPlayer } from "./components/VideoPlayer";
import { ResultsPanel } from "./components/ResultsPanel";
import { UserGuide } from "./components/UserGuide";
import type { FormFault } from "./exercises/types";

interface AnalysisResult {
  exercise: string;
  totalReps: number;
  overallScore: number;
  reps: { repNumber: number; score: number; faults: FormFault[]; primaryAngle: number }[];
  faults: FormFault[];
  videoUrl: string;
  recordedVideoUrl: string;
  duration: number;
}

function App() {
  const [selectedExercise, setSelectedExercise] = useState("squat");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleReset = () => {
    setVideoFile(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#11111b]">
      <UserGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <header className="border-b border-gray-800 bg-[#1e1e2e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white">FormJudge</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">Exercise Form Analyzer</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {!result && (
          <>
            <ExerciseSelector selected={selectedExercise} onSelect={setSelectedExercise} />

            <div className="space-y-4">
              <VideoUpload
                onVideoSelect={setVideoFile}
                disabled={false}
              />

              {videoFile && (
                <VideoPlayer
                  videoFile={videoFile}
                  exerciseId={selectedExercise}
                  onAnalysisComplete={setResult}
                />
              )}
            </div>

            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-1">Quick filming tips</h3>
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    <li>Film from the <strong className="text-gray-400">side</strong> — full body in frame</li>
                    <li>Camera at hip height, 2-3 meters away</li>
                    <li>Start standing tall before your set</li>
                    <li>Wear fitted clothing so joints are visible</li>
                    <li>Good lighting — avoid filming against a window</li>
                  </ul>
                  <button
                    onClick={() => setShowGuide(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
                  >
                    Read the full guide
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {result && (
          <ResultsPanel
            exercise={result.exercise}
            totalReps={result.totalReps}
            overallScore={result.overallScore}
            reps={result.reps}
            faults={result.faults}
            duration={result.duration}
            recordedVideoUrl={result.recordedVideoUrl}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-gray-600">
          Pose detection runs 100% in your browser via MediaPipe. No video data is sent to any server.
        </div>
      </footer>
    </div>
  );
}

export default App;
