# AGENTS.md

## Quick Reality Check

- Single-package Node + TypeScript project (no monorepo/workspaces).
- Runtime entrypoint is `src/bot.ts` (started by `npm run dev`).
- Module system is ESM (`"type": "module"`, `module: "nodenext"`), so local TS imports use `.js` suffixes.

## Setup and Run (Verified from scripts/config)

- Install deps: `npm install`
- Copy env: `cp .env.example .env`
- Generate Prisma client: `npm run prisma:generate`
- Apply local migrations: `npm run prisma:migrate`
- Run bot in watch mode: `npm run dev`

Recommended order for a fresh setup: install -> env -> prisma generate -> prisma migrate -> dev.

## Test and Focused Verification

- Full tests: `npm test` (runs `vitest --run`).
- Single file: `npx vitest --run src/commands/_tests/get-next-race.test.ts`
- Name filter: `npx vitest --run -t "runMondayPriorAlerts"`
- Always create new tests in the corresponding `_tests/` folder near the module under test.

There are no repo scripts for lint/typecheck/build; do not assume they exist.

## Architecture Notes That Matter

- `src/bot.ts` wires everything: command registration + scheduler startup.
- Commands live in `src/commands/`:
  - `/next_race` and `/standings` fetch Jolpica/Ergast data.
  - subscription commands use `src/subscriptions/repository.ts`.
- Alert scheduler is `src/notifications/scheduler.ts`, cron in UTC from `ALERTS_CRON`.
- Alert dedupe is DB-backed via `NotificationDispatch` unique key (`chatId`, `raceKey`, `window`) in `prisma/schema.prisma`.

## Env and DB Gotchas

- Env parsing is strict via Zod in `src/env.ts`; missing `DATABASE_URL` or token fails startup.
- `.env.example` currently sets `DATABASE_URL="file:./dev.db"` (project root).
- `.gitignore` ignores `prisma/**/*.db` only, not root `*.db`; avoid accidentally committing a root SQLite file.

## Editing Conventions Observed in Code

- Bot/user-facing text is in Portuguese; tests assert exact message strings.
- Telegram sends use `parse_mode: "Markdown"`; preserve formatting compatibility when editing messages.
- Scheduler and command modules are written to be testable via dependency injection/mocked functions; keep this style for new logic.
