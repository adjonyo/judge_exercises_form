# AGENTS.md

## Project Status

Working app — React + TypeScript + Vite frontend with MediaPipe pose detection running 100% in-browser.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Pose Detection**: `@mediapipe/tasks-vision` (Pose Landmarker, WASM, client-side)
- **Styling**: Tailwind CSS 4
- **Linter**: oxlint
- **No backend** — all processing happens in the browser

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run lint     # Run oxlint
npm run preview  # Preview production build
```

Run `npm run build` before committing — it runs `tsc -b && vite build`.

## Architecture

```
src/
├── lib/
│   ├── pose.ts           # MediaPipe wrapper + landmark constants
│   ├── geometry.ts       # angleDeg(), smoothing utilities
│   └── repDetector.ts    # Phase state machine + rep scoring
├── exercises/
│   ├── types.ts          # Shared types (ExerciseConfig, Phase, FormFault, etc.)
│   ├── index.ts          # Exercise registry + frame analyzer dispatch
│   ├── squat.ts          # Per-exercise config + form checks + analyzer
│   ├── deadlift.ts
│   ├── bicepCurl.ts
│   ├── benchPress.ts
│   ├── jmPress.ts
│   ├── dips.ts
│   ├── inclineCurl.ts
│   ├── rowing.ts
│   ├── lunge.ts
│   ├── bulgarianSplitSquat.ts
│   └── wallBall.ts
├── components/
│   ├── ExerciseSelector.tsx
│   ├── VideoUpload.tsx
│   ├── VideoPlayer.tsx    # Video + skeleton overlay + live HUD
│   ├── ResultsPanel.tsx   # Score ring, per-rep breakdown, fault summary
│   ├── Skeleton.tsx       # SVG skeleton overlay
│   └── UserGuide.tsx      # Tabbed modal with full user guide for novices
├── App.tsx                # Root component — orchestrates upload → analysis → results
└── main.tsx
```

## How It Works

1. User uploads a video file + selects exercise
2. `VideoPlayer` seeks through video frame-by-frame at 30fps
3. Each frame: MediaPipe detects 33 pose landmarks
4. `RepDetector.processFrame()` computes joint angles, runs phase state machine
5. Exercise-specific `FormCheck` rules evaluate angles against thresholds
6. Rep counted on `down → up` phase transition
7. Results: overall score (0-100), per-rep breakdown, fault summary

## Adding a New Exercise

1. Create `src/exercises/myExercise.ts` exporting:
   - `myExerciseConfig: ExerciseConfig` — set `id` to a kebab-case string (e.g. `"my-exercise"`)
   - `analyzeMyExercise(lm, phase): { angles, faults }` — compute joint angles from landmarks, evaluate form checks
2. Register in `src/exercises/index.ts`:
   - Add `import { myExerciseConfig, analyzeMyExercise } from "./myExercise"`
   - Add `myExerciseConfig` to the `EXERCISES` array
   - Add `"my-exercise": analyzeMyExercise` to the `analyzers` map
3. Exercise appears automatically in the selector

The `id` in the config **must** match the key in the `analyzers` map — mismatch causes a runtime throw.

## Key Conventions

- Pose landmark indices follow `@mediapipe/tasks-vision` constants (0-32)
- Joint angles use `angleDeg(a, b, c)` where `b` is the vertex
- Phase state machine: idle → descending → bottom → ascending → top (rep counted on ascending→top)
- Form faults have `severity: "warning" | "critical"` — critical deducts 20pts, warning deducts 5pts
- All processing is client-side — no video data leaves the browser

## Gotchas

- **MediaPipe model loads from CDN** (`storage.googleapis.com`). The `pose_landmarker_heavy.task` is ~130MB. First analysis after page load is slow while the model downloads; subsequent analyses use the cached model.
- **Angle smoothing** in `RepDetector` uses exponential moving average: `smoothed = smoothed * 0.7 + raw * 0.3`. Increasing the raw weight makes tracking more responsive but noisier.
- **Phase hysteresis**: the `bottom` phase triggers at `down - 10` (not `down`) to prevent flicker between phases. If you tune an exercise's `down` threshold, be aware this 10-degree buffer applies.
- **`VideoPlayer` processes frames sequentially** via `video.currentTime` seeking — it does not decode at real-time speed. A 60-second video takes roughly 15-30s to process depending on hardware.
- **Tailwind CSS 4** uses `@tailwindcss/vite` plugin and `@import "tailwindcss"` in CSS — no `tailwind.config.js` file exists.
