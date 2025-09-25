# Repository Guidelines

## Project Structure & Module Organization
- Current: `prd.md` — Product Requirements Document. Read this first for scope and priorities.
- Planned (once scaffolded):
  - `apps/web` — React + TypeScript (Vite). Folders: `src/` (code), `public/` (assets), `src/components/`, `src/hooks/`, `src/audio/`.
  - `apps/server` (post‑MVP) — Node/Express API for patch sharing.
  - `packages/audio` (optional) — Shared Web Audio/Tone.js utilities.
  - Tests co‑located as `*.test.ts(x)`; broader integration in `tests/`.

## Build, Test, and Development Commands
- Frontend (after scaffold): `cd apps/web && npm install && npm run dev` — local dev server.
- Build/preview: `npm run build` — production bundle; `npm run preview` — serve build.
- Quality: `npm run lint` (ESLint) · `npm run format` (Prettier).
- Tests: `npm test` — unit tests; `npm test -- --watch` — watch mode.
- Server (when added): `cd apps/server && npm install && npm run dev` (nodemon) · `npm start` (prod).

## Coding Style & Naming Conventions
- TypeScript, 2‑space indentation, semicolons, single quotes.
- ESLint (ts, react, jsx‑a11y) + Prettier; commits pass lint/format.
- React: components PascalCase (`Knob.tsx`), hooks `useX.ts`, utilities camelCase, constants UPPER_SNAKE_CASE.
- Files: components PascalCase; modules kebab‑case; CSS modules `*.module.css`.
- Audio: keep Web Audio/Tone.js logic in `src/audio/`; avoid DOM timers for scheduling.

## Testing Guidelines
- Framework: Vitest or Jest with React Testing Library.
- Coverage goal ≥80% for audio graph, patch management, and UI controls.
- Naming: `*.test.ts`/`*.test.tsx` near source; integration in `tests/`.
- Tips: mock `AudioContext`, stub time‑based nodes, verify keyboard/a11y on knobs/sliders.

## Commit & Pull Request Guidelines
- Commits use Conventional Commits (e.g., `feat: add ADSR envelope`, `fix(ui): knob drag inertia`).
- PRs include description, linked issue, screenshots/clip (audio sample if relevant), and test plan; ensure lint/tests/build pass.
- Note schema changes when patch JSON evolves.

## Security & Configuration Tips
- Do not commit secrets; use `.env.local` and provide `.env.example`.
- Request MIDI with user gesture; handle denials gracefully.
- Validate imported patch JSON; sanitize user strings; avoid `eval`.

## Getting Started
1) Read `prd.md`. 2) Scaffold `apps/web` and run dev server. 3) Build a vertical slice: oscillator → UI control → test.
