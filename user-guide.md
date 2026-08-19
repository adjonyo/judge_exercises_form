# User Guide

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ (LTS recommended)
- npm (bundled with Node.js)

## Quick Start

```bash
./start.sh
```

Installs dependencies and launches the dev server at http://localhost:5173. Open that URL, select an exercise, upload a video, and you're good to go.

## Setup (manual)

```bash
git clone https://github.com/adjonyo/judge_exercises_form.git
cd judge_exercises_form
npm install
npm run dev
```

## Development

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser. The app hot-reloads on file changes.

## Build

```bash
npm run build
```

Outputs the production build to `dist/`. TypeScript is checked first via `tsc -b`, then Vite bundles.

## Preview Production Build

```bash
npm run build && npm run preview
```

Serves the `dist/` folder locally (default: http://localhost:4173).

## Lint

```bash
npm run lint
```

Runs [oxlint](https://oxc-project.github.io/oxc/oxc_linter.html) with default config. No custom rules — just catch obvious issues.

## How to Test the App

1. Run `./start.sh` (or `npm run dev`)
2. Select an exercise from the grid
3. Upload a video of yourself performing that exercise
   - Film from the side with your full body in frame
   - Good lighting, steady camera, uncluttered background
4. The app processes the video frame-by-frame (progress shown in the HUD)
5. Results appear: overall score, per-rep breakdown, detected faults with severity
6. Click **Download Video** to save the annotated `.webm` with skeleton overlay, rep count, phase indicator, and fault labels burned in

### What to look for

- **Rep count** matches your actual reps
- **Score** reflects form quality (lower scores = more faults)
- **Faults** are specific (e.g. "insufficient depth" or "elbow flare") — vague output means the form checks need tuning
- **No reps detected** usually means the video angle is wrong (must be side view, full body visible)

### Video download

After analysis completes, a green **Download Video** button appears in the results header. Clicking it saves a `.webm` file with the skeleton overlay, exercise name, rep count, phase indicator, first fault message, and progress bar all burned into the video. The file is named `formjudge-{exercise}-{timestamp}.webm`.

### Processing speed

A 60-second video takes roughly 15–30 seconds to process depending on hardware. The MediaPose model (~130MB) downloads on first analysis; subsequent runs use browser cache.

## Adding a New Exercise

See [project.md](./project.md) for the full spec. Quick version:

1. Create `src/exercises/myExercise.ts` — export a config and analyzer
2. Register in `src/exercises/index.ts` — add to `EXERCISES` array and `analyzers` map
3. Run `npm run build` to verify TypeScript compiles

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails with "import type" error | Use `import type { Foo }` for type-only imports |
| Build fails with "enum" error | Use `type` unions or `as const` instead — enums are forbidden |
| No reps detected | Check video is filmed from the side, full body in frame |
| App crashes during analysis | Likely missing landmarks — ensure good lighting and clear view |
| Slow first analysis | Normal — the ~130MB MediaPipe model downloads from CDN on first run |
