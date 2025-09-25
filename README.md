WebSynth Studio (MVP)

Overview
- React + TypeScript Vite app for a browser-based analogue synth.
- Follows PRD, best_practices.md, and technology.md.

Monorepo
- Root `package.json` uses npm workspaces: `apps/*`.
- Primary app: `apps/web`.

Quick Start
- Install deps: `cd apps/web && npm install`.
- Dev server: `npm run dev` (from repo root or inside `apps/web`).
- Build: `npm run build` · Preview: `npm run preview`.
- Lint/Format: `npm run lint` · `npm run format`.
- Tests: `npm test`.

Structure
- apps/web/src/audio: Web Audio engine utilities.
- apps/web/src/components: UI components (knobs/sliders/etc.).
- apps/web/src/hooks: React hooks (state, engine).

Security & A11y
- No secrets committed; see `.env.example`.
- Audio requires a user gesture to start.
- Controls are keyboard-accessible with ARIA labels.

Next Steps
- Add more modules (filters, envelope, LFO).
- Persist patches in localStorage; export/import JSON.
- Add MIDI input and basic preset browser.

