<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# dialog-kinerja

Next.js 16.3 + React 19 + Tailwind v4 + Prisma 7 (PostgreSQL) app for a performance-review ("Dialog Kinerja") workflow. Indonesian domain: roles are `ADMIN`, `ATASAN` (manager), `PEGAWAI` (employee).

## Commands

- Package manager is **npm** (`package-lock.json` is the only lockfile).
- `npm run dev` — dev server.
- `npm run lint` — eslint (no `--fix`, no typecheck).
- `npm run build` — production build.
- No test framework is configured; `npx tsc --noEmit` is the typecheck.

## Prisma (v7, breaking changes apply)

- Client is generated to `generated/prisma` (gitignored). **Run `npx prisma generate` after any schema change** — imports resolve from `../generated/prisma/client`, not `@prisma/client`.
- Prisma 7 requires a **driver adapter**: `lib/prisma.ts` and `prisma/seed*.ts` construct `PrismaClient` with `@prisma/adapter-pg` (driver `pg`). Never drop the adapter or you'll get "driver adapter is required" errors.
- Config lives in `prisma.config.ts` (schema path, migrations dir, seed `tsx prisma/seed.ts`); env loaded via `dotenv`. `prisma/schema.prisma` uses `@@map` to snake_case table names.
- Migration flow: `npx prisma migrate dev`; seed via `npx prisma db seed`. Seed users: `admin123` / `atasan123` / `pegawai123`.

## Enums

- `StatusDialog`: `draft_atasan`, `menunggu_pegawai`, `menunggu_atasan`, `menunggu_validasi`, `selesai`
- `StatusReviu`: `draft_pegawai`, `menunggu_atasan`, `menunggu_validasi`, `selesai`
- `JenisAspek`: `SKP`, `GAP_ASESMEN`, `PERILAKU`, `KARIR_PENDEK`, `KARIR_MENENGAH` (5 total, ordered via `lib/constants/aspek.ts`)

## Architecture

- **Auth gate is `proxy.ts`** (root-level, Next 16's `proxy` file replacing `middleware.ts`). Redirects unauthenticated users to `/login` and sends logged-in users to `homePathForRole`. When adding protected routes, keep the `matcher` in sync.
- Sessions: iron-session cookie (`lib/auth/session.ts`). Roles come from `session.role`; a user's capabilities derive from `is_admin` / `as_pegawai` flags via `capabilitiesForUser`. Guards: `requireAuth()`, `requireRole(...roles)`.
- Route groups: `app/(app)/admin`, `app/(app)/atasan`, `app/(app)/pegawai` each have their own `layout.tsx`; shared group layout in `app/(app)/layout.tsx`.
- Mutations are server actions under `lib/actions/*`; read queries in `lib/*-queries.ts`; helpers (status/display/format) in `lib/*.ts`.
- Signature uploads live in `uploads/` (gitignored) and are served by `app/ttd/[file]/route.ts`.
- Word export: `lib/export/word-legacy.ts` (HTML-as-`.doc`), `lib/export/docx.ts` (native via `docx` npm package). PDF export via `@react-pdf/renderer` in `lib/export/pdf.ts`.
- Path alias: `@/*` → repo root (e.g. `@/lib/auth/session`).

## Env

`.env` is required and gitignored: `DATABASE_URL` (PostgreSQL connection string, e.g. `postgresql://postgres:PASSWORD@localhost:5432/dialog_kinerja_db?schema=public`) and `SESSION_SECRET`.
