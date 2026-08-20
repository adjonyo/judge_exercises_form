import type { FormFault } from "../exercises/types";

interface RepData {
  repNumber: number;
  score: number;
  faults: FormFault[];
  primaryAngle: number;
  isGood: boolean;
}

interface Props {
  exercise: string;
  totalReps: number;
  goodReps: number;
  badReps: number;
  overallScore: number;
  reps: RepData[];
  faults: FormFault[];
  duration: number;
  recordedVideoUrl: string;
  onReset: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#374151" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

export function ResultsPanel({ exercise, totalReps, goodReps, badReps, overallScore, reps, faults, duration, recordedVideoUrl, onReset }: Props) {
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60);

  const faultSummary = faults.reduce<Record<string, { count: number; severity: "warning" | "critical"; message: string }>>((acc, f) => {
    if (!acc[f.name]) acc[f.name] = { count: 0, severity: f.severity, message: f.message };
    acc[f.name].count++;
    return acc;
  }, {});

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Results — {exercise}</h2>
        <div className="flex items-center gap-3">
          <a
            href={recordedVideoUrl}
            download={`formjudge-${exercise.replace(/\s+/g, "-")}-${Date.now()}.webm`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Video
          </a>
          <button
            onClick={onReset}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Analyze another video
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{totalReps}</div>
          <div className="text-xs text-gray-400 mt-1">Total Reps</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{goodReps}</div>
              <div className="text-xs text-gray-500">Good</div>
            </div>
            <div className="text-gray-600">/</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{badReps}</div>
              <div className="text-xs text-gray-500">Bad</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">Quality</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
          <ScoreRing score={overallScore} />
          <div className="text-xs text-gray-400 mt-2">Score</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-400 mt-1">Duration</div>
        </div>
      </div>

      {Object.keys(faultSummary).length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Form Issues Detected</h3>
          <div className="space-y-2">
            {Object.entries(faultSummary)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([name, data]) => (
                <div
                  key={name}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    data.severity === "critical"
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-amber-500/10 border border-amber-500/20"
                  }`}
                >
                  <span className={`text-sm ${data.severity === "critical" ? "text-red-300" : "text-amber-300"}`}>
                    {data.message}
                  </span>
                  <span className={`text-xs font-mono ${data.severity === "critical" ? "text-red-400" : "text-amber-400"}`}>
                    x{data.count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Per-Rep Breakdown</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {reps.map((rep) => (
            <div
              key={rep.repNumber}
              className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-gray-500 w-8">#{rep.repNumber}</span>
                <span
                  className={`text-sm font-medium ${
                    rep.score >= 80
                      ? "text-green-400"
                      : rep.score >= 60
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {rep.score}
                </span>
                <span className={`text-xs ${rep.isGood ? "text-green-400" : "text-red-400"}`}>
                  {rep.isGood ? "✓" : "✗"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">{Math.round(rep.primaryAngle)}deg</span>
                {rep.faults.length > 0 && (
                  <span className="text-xs text-red-400">
                    {rep.faults.length} issue{rep.faults.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
          {reps.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              No reps were detected. Try filming from the side with your full body in frame.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
