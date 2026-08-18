import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function UserGuide({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"getting-started" | "filming" | "understanding" | "exercises">("getting-started");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1e1e2e] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              ?
            </div>
            <h2 className="text-lg font-bold text-white">How to Use FormJudge</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            X
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(["getting-started", "filming", "understanding", "exercises"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "getting-started" && "Quick Start"}
              {tab === "filming" && "Filming Tips"}
              {tab === "understanding" && "Reading Results"}
              {tab === "exercises" && "Exercises"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm">
          {activeTab === "getting-started" && (
            <>
              <Section title="What is FormJudge?">
                <p>
                  FormJudge watches your workout video and gives you instant feedback on your
                  exercise form. It uses your camera to track your body movements and counts
                  your reps while checking if you are doing the exercise correctly.
                </p>
                <p className="mt-2">
                  Everything happens on your device. Your video never leaves your phone or
                  computer.
                </p>
              </Section>

              <Section title="Step-by-Step Guide">
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    <strong className="text-white">Pick your exercise</strong> — Tap the
                    exercise you want to check (Squat, Deadlift, Bicep Curl, etc.)
                  </li>
                  <li>
                    <strong className="text-white">Upload your video</strong> — Tap the
                    upload area or drag and drop a video file. Use MP4, MOV, or WebM format.
                  </li>
                  <li>
                    <strong className="text-white">Tap "Analyze Video"</strong> — The app
                    will process your video frame by frame. This usually takes 15-60 seconds
                    depending on video length.
                  </li>
                  <li>
                    <strong className="text-white">Get your results</strong> — See your
                    overall score, how many reps you did, and any form issues that were
                    detected.
                  </li>
                </ol>
              </Section>

              <Section title="What You Need">
                <ul className="list-disc list-inside space-y-1">
                  <li>A phone or computer with a web browser (Chrome, Safari, Firefox, Edge)</li>
                  <li>A video of yourself doing an exercise</li>
                  <li>No app to install — it runs in your browser</li>
                  <li>No account or sign-up needed</li>
                </ul>
              </Section>
            </>
          )}

          {activeTab === "filming" && (
            <>
              <Section title="The Most Important Rule: Film from the Side">
                <p>
                  FormJudge judges your form by looking at your joint angles. This works best
                  when the camera sees you from the <strong className="text-white">side</strong>.
                  Filming from the front or back will give inaccurate results.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-indigo-300 font-medium">
                    Side view = accurate form analysis
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Stand perpendicular to the camera so it sees your full profile.
                  </p>
                </div>
              </Section>

              <Section title="Camera Setup">
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="text-white">Height:</strong> Place the camera at
                    roughly hip height. Not on the floor looking up, not on a shelf looking
                    down.
                  </li>
                  <li>
                    <strong className="text-white">Distance:</strong> Far enough back that
                    your whole body is visible — from head to toes. About 2-3 meters (6-10
                    feet) works well.
                  </li>
                  <li>
                    <strong className="text-white">Stability:</strong> Prop your phone
                    against something stable or use a tripod. A shaky camera makes it harder
                    to track your movements.
                  </li>
                  <li>
                    <strong className="text-white">Frame:</strong> Make sure your full body
                    stays in the frame for the entire set. If you step out of view, the
                    tracker loses you.
                  </li>
                </ul>
              </Section>

              <Section title="Lighting">
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure the room is well lit — you should be clearly visible</li>
                  <li>
                    Avoid filming with a window behind you (backlight) — this makes you look
                    like a dark silhouette
                  </li>
                  <li>
                    Even lighting is best — no need for professional lights, just turn on the
                    room lights
                  </li>
                </ul>
              </Section>

              <Section title="Clothing">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Wear <strong className="text-white">fitted clothing</strong> — baggy
                    clothes hide your joints and make it harder for the app to track you
                  </li>
                  <li>Shorts and a t-shirt work great</li>
                  <li>Avoid all-black outfits if possible — contrast helps tracking</li>
                </ul>
              </Section>

              <Section title="Before You Start Recording">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Start in a <strong className="text-white">standing position</strong>{" "}
                    — tall and still. This helps the app lock onto your body.
                  </li>
                  <li>
                    Wait 1-2 seconds before starting your exercise — this gives the tracker
                    time to find you.
                  </li>
                  <li>Complete your full set without pausing the recording.</li>
                </ul>
              </Section>

              <Section title="Common Mistakes">
                <ul className="list-disc list-inside space-y-1">
                  <li>Filming from the front — always film from the side</li>
                  <li>
                    Camera too close — if the app can only see your upper body, it cannot
                    judge your form properly
                  </li>
                  <li>
                    Too much movement — avoid walking around between reps; stay in one spot
                  </li>
                  <li>
                    Recording too short — start recording before you begin, stop after you
                    finish
                  </li>
                </ul>
              </Section>
            </>
          )}

          {activeTab === "understanding" && (
            <>
              <Section title="Your Score (0-100)">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10">
                    <span className="text-green-400 font-bold text-lg">80-100</span>
                    <span className="text-gray-300">
                      Great form — keep doing what you are doing
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10">
                    <span className="text-amber-400 font-bold text-lg">60-79</span>
                    <span className="text-gray-300">
                      Good, but there is room for improvement
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-red-500/10">
                    <span className="text-red-400 font-bold text-lg">0-59</span>
                    <span className="text-gray-300">
                      Needs work — review the form issues below
                    </span>
                  </div>
                </div>
              </Section>

              <Section title="Rep Count">
                <p>
                  The app automatically counts each time you complete a full rep — going all
                  the way down and coming back up. If the rep count looks wrong, it usually
                  means the camera angle was off or your full body was not visible.
                </p>
              </Section>

              <Section title="Form Issues">
                <p>
                  The app detects common form mistakes and labels them as either:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li>
                    <strong className="text-red-400">Critical issues</strong> — These are
                    form mistakes that can lead to injury (e.g., knees caving in during a
                    squat, rounding your back during a deadlift). Each critical issue lowers
                    your score by 20 points.
                  </li>
                  <li>
                    <strong className="text-amber-400">Warnings</strong> — These are
                    suggestions to improve your form but are less dangerous (e.g., not going
                    deep enough, leaning too far forward). Each warning lowers your score by 5
                    points.
                  </li>
                </ul>
              </Section>

              <Section title="Per-Rep Breakdown">
                <p>
                  Below the overall results, you will see a breakdown of each individual rep.
                  This shows you exactly which reps had issues and what happened during each
                  one. Use this to spot patterns — for example, your form might break down on
                  later reps when you get tired.
                </p>
              </Section>

              <Section title="Why My Score Might Be Low">
                <ul className="list-disc list-inside space-y-1">
                  <li>Camera was not positioned at the right angle</li>
                  <li>Full body was not visible in the frame</li>
                  <li>Lighting was too dark or you were backlit</li>
                  <li>Clothing was too baggy to see joint positions</li>
                  <li>You were moving around between reps</li>
                  <li>The exercise was performed incorrectly (this is what the app is designed to catch)</li>
                </ul>
              </Section>
            </>
          )}

          {activeTab === "exercises" && (
            <>
              <ExerciseCard
                name="Squat"
                view="Side view"
                tips="Go to full depth — hips below knees. Keep knees tracking over toes, chest up, and back straight."
              />
              <ExerciseCard
                name="Wall Ball"
                view="Side view"
                tips="HYROX standard — hips must descend below knee level at the bottom. Film from the side to judge depth accurately."
              />
              <ExerciseCard
                name="Deadlift"
                view="Side view"
                tips="Hinge at the hips, keep your back straight. The bar should travel close to your legs. Avoid rounding your lower back."
              />
              <ExerciseCard
                name="Bench Press"
                view="Side view"
                tips="Lower the bar to your chest and press up to full lockout. Keep elbows at roughly 45 degrees — do not flare them wide."
              />
              <ExerciseCard
                name="Bicep Curl"
                view="Side view"
                tips="Keep your elbows pinned to your sides throughout the movement. Avoid swinging your body to lift the weight."
              />
              <ExerciseCard
                name="Incline Bicep Curl"
                view="Side view"
                tips="Sit on an incline bench. Let your arms hang straight down, then curl up. Do not let your elbows drift forward."
              />
              <ExerciseCard
                name="JM Triceps Press"
                view="Side view"
                tips="Lower the bar toward your forehead with elbows tucked. Press back up to full lockout."
              />
              <ExerciseCard
                name="Dips"
                view="Side view"
                tips="Lower until your upper arms are at least parallel to the floor. Press back up to full arm extension."
              />
              <ExerciseCard
                name="Rowing"
                view="Side view"
                tips="Keep your back straight throughout. Pull the weight toward your lower chest, squeezing your shoulder blades together."
              />
              <ExerciseCard
                name="Barbell Reverse Lunge"
                view="Side view"
                tips="Step back and lower until your back knee is close to the ground. Keep your front knee from going past your toes."
              />
              <ExerciseCard
                name="Bulgarian Split Squat"
                view="Side view"
                tips="Rear foot elevated on a bench. Lower until your front thigh is parallel to the ground. Keep your torso upright."
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-[#1a1a2e]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
          >
            Got it — let's go!
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <div className="text-gray-400 leading-relaxed">{children}</div>
    </div>
  );
}

function ExerciseCard({ name, view, tips }: { name: string; view: string; tips: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white font-medium">{name}</span>
        <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
          {view}
        </span>
      </div>
      <p className="text-xs text-gray-400">{tips}</p>
    </div>
  );
}
