# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and API routes (e.g., `src/app/api/...`).
- `src/components`: Reusable React components.
- `src/lib`: Utilities (e.g., `storage.ts` for localStorage persistence, slug/id helpers).
- `src/types`: Shared TypeScript types.
- Config: `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm run dev`: Start the dev server on port `3000`. Use `./start-dev.sh` (bash) or `start-dev.bat` (Windows) to auto‑free port 3000 first.
- `npm run build`: Production build.
- `npm start`: Run the built app.
- `npm run lint`: Lint with Next.js ESLint config.
- Versioning: `npm run version:patch|minor|major` (standard‑version) then pushes tags.

## Coding Style & Naming Conventions
- TypeScript, strict mode; path alias `@/*` maps to `src/*`.
- Prefer functional React components with hooks; keep files in `src/components`.
- Slugs: use kebab‑case (see `storage.generateSlug`).
- Styling: Tailwind CSS via `globals.css` and `tailwind.config.ts`.
- Run `npm run lint` and fix warnings before PRs.

## Testing Guidelines
- No test framework is configured yet. For new tests, prefer adding unit tests with Jest/Vitest and colocate as `*.test.ts(x)` next to source files. Keep functions pure where possible to ease testing.

## Commit & Pull Request Guidelines
- Conventional Commits required (see `.versionrc.json`): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, etc.
- Keep messages imperative and scoped: `feat(comparisons): prevent duplicate entries`.
- PRs: include a clear description, linked issues (`Fixes #123`), screenshots/GIFs for UI changes, and notes on any breaking changes.

## Security & Configuration Tips
- Env: add variables to `.env.local` (example in `.env.local.example`). Keys prefixed with `NEXT_PUBLIC_` are exposed to the client.
- Build injects git metadata (`NEXT_PUBLIC_GIT_COMMIT`) from `next.config.mjs`; ensure git is available during builds.
- Local data persists in browser `localStorage` under `versus_*` keys—avoid storing sensitive data.

## Agent-Specific Instructions
- Always run on port `3000`. If busy, kill node processes first using `./start-dev.sh` (bash) or `start-dev.bat` (Windows). See `CLAUDE.md` / `WARP.md` for details.
