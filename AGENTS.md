# FormJudge — Agent Guide

Client-only React app that analyzes exercise form from uploaded video using MediaPipe Pose Landmarker (in-browser ML, no backend).

## Commands

- `./start.sh` — installs deps + starts dev server (simplest entry point)
- `npm run dev` — Vite dev server on `0.0.0.0:5173` (also reachable via Tailscale at `100.123.155.124:5173`)
- `./node_modules/.bin/tsc -b` — typecheck (must use local bin; `tsc` is not on PATH globally)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — oxlint (currently broken on Node < 20; skip on this machine)

**Typecheck order matters:** `tsc -b` uses project references (`tsconfig.app.json` for src/, `tsconfig.node.json` for vite.config.ts). Both must pass.

## Node version constraint

This machine runs **Node 18.10.0**. Many modern packages require Node 20+. Key constraints:
- Vite pinned to `^6.0.0` (v8 requires Node 20)
- TypeScript pinned to `~5.7.0` (v6 requires Node 20)
- Tailwind pinned to `^3.4.17` via PostCSS (Tailwind v4 Vite plugin is broken on Node 18)
- oxlint is broken on Node 18 — ignore `npm run lint` failures
- `erasableSyntaxOnly` tsconfig option is TS 5.8+ only — do not add it

## Architecture

```
src/
  App.tsx              — root state: selectedExercise, videoFile, analysis result
  main.tsx             — React 19 entry (StrictMode enabled)
  components/
    VideoUpload.tsx    — drag-drop/click file picker, passes File to App
    VideoPlayer.tsx    — core: seek-based frame loop → MediaPipe → canvas overlay → MediaRecorder
    Skeleton.tsx       — SVG overlay for live landmark display
    ResultsPanel.tsx   — post-analysis scores, rep breakdown, fault summary
    ExerciseSelector.tsx — exercise grid picker
    UserGuide.tsx      — in-app help modal
  lib/
    pose.ts            — MediaPipe PoseLandmarker singleton (heavy model, GPU delegate)
    repDetector.ts     — phase state machine (idle→descending→bottom→ascending→top)
    geometry.ts        — angle, midpoint, distance helpers
  exercises/
    types.ts           — shared types (Phase, FormFault, ExerciseConfig, Landmarks)
    index.ts           — exercise registry + frame analyzer dispatch
    squat.ts, deadlift.ts, ... — per-exercise angle computation + form checks
```

## Critical gotchas

- **VideoPlayer `videoUrl` must be memoized** (`useMemo`). Previously `URL.createObjectURL()` was called on every render, causing the video `src` to change on each re-render. Progress state updates triggered re-renders → URL recreated → video reloaded → seek loop broke → progress stuck at 0%. This was the main bug fixed in commit `a46cdea`.
- **MediaPipe model download** (`pose_landmarker_heavy`, ~130MB) happens on first analysis click. If it fails (network/CORS), the app now shows an error banner instead of hanging.
- **All processing is client-side.** Video never leaves the browser. The MediaRecorder captures the annotated canvas as a downloadable `.webm`.
- **Exercise analyzers** each export an `ExerciseConfig` (thresholds) and an `analyze*()` function. New exercises go in `src/exercises/` and must be registered in `src/exercises/index.ts`.

## Tailwind

Tailwind v3 with PostCSS (not the Vite plugin). Config in `tailwind.config.js` + `postcss.config.js`. Custom colors defined in the config `theme.extend.colors` and also as CSS custom properties in `src/index.css`.
