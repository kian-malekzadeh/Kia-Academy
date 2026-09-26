# Implementation Status — Kia Academy

> Persistent project memory (per master build contract §7). The repository is the source
> of truth; this file tracks phase state, gates, and pending work. Updated 2026-09-26.

## Context

The platform was **rebuilt** around a Persian-first product shape (see
[`REBUILD_ARCHITECTURE.md`](./REBUILD_ARCHITECTURE.md)). The original master-spec phase
list (Phases 0–37) was largely superseded by the rebuild; the security/quality backlog
now lives in [`AUDIT.md`](./AUDIT.md) and the go-live gates in
[`PRE_LAUNCH_CHECKLIST.md`](./PRE_LAUNCH_CHECKLIST.md).

## Current state (this session)

| Gate | Status |
| --- | --- |
| Dependencies installed (pnpm, frozen env templates copied) | ✅ |
| PostgreSQL 16 via `pnpm docker:db` (kia-postgres) | ✅ |
| 18 Prisma migrations applied (latest: `20260926120000` EXAM-3 question snapshots) | ✅ |
| Seed data present (6 users · 4 courses · 266 lessons) | ✅ |
| `pnpm typecheck` (shared + api + web) | ✅ |
| `pnpm lint` (all workspaces) | ✅ |
| `pnpm test` — 209/209 (shared 41, web 36, api 132) | ✅ |
| `pnpm build` (production, 344 static pages) | ✅ |
| Runtime smoke (`scripts/smoke.sh`, 28 probes incl. OTP + password + 2FA flows) | ✅ |

## New this session

- `scripts/smoke.sh` — one-shot production-build smoke: boots built api+web, probes
  health, public pages, auth gates (401s), SEO artifacts, a real OTP
  request→verify cycle, and the full password-reset/change flow; exits non-zero on failure.
- `docs/IMPLEMENTATION_STATUS.md` — this file.
- XSS hardening (layout.tsx): JSON-LD `__html` now neutralizes `<` (`\u003c`) so
  future dynamic structured data (e.g. Course schema with admin-entered titles)
  can never break out of the `<script>` tag.
- FE-2 from `AUDIT.md` verified safe: `markdownToHtml` escapes all input before tag
  emission (`escapeHtml` covers `& < > " '`), link `href`s restricted to
  `https?://` or site-relative; no raw HTML passthrough.

### DB-2/DB-3/DB-4 — schema typing + soft delete (implemented this session)

- **DB-2:** `UserStatus` / `OrderSource` / `EntitlementResourceType` Postgres enums
  replace the last stringly-typed state columns (migration `20260906140000`
  remaps existing rows first). Fixed a latent grant→check mismatch: the admin
  entitlement form wrote `readiness_test`/`roadmap_bundle`, which learner checks
  (`roadmap:`/`readiness:` keys) never matched — the grant API now normalizes to
  the canonical enum vocabulary and the admin UI offers canonical values.
- **DB-3:** all 14 text-JSON columns → `jsonb` (Prisma `Json`); ~40
  JSON.parse/stringify round-trips removed across readiness, payments,
  roadmaps, course-exams, test-banks, personality, assessments, site-settings,
  challenges, admin, and seed.
- **DB-4:** `User.deletedAt` soft delete; `Order→User`, `Payment→User`,
  `Invoice→Order` FKs now `ON DELETE RESTRICT` so financial records cannot
  vanish via cascade; SUPER_ADMIN-only soft-delete (PII-anonymizing, forces
  logout, audited, identity-hash correlation for historical rows) + restore
  endpoints with unit tests. Soft-deleted users are hidden from admin lists
  and fully locked out of authentication.

### AUTH-5 — admin TOTP two-factor authentication (implemented this session)

- **Core (in-repo, dependency-free):** RFC 6238 TOTP (SHA-1, 6 digits, 30s step,
  ±1 step drift, constant-time compare) + RFC 4648 base32 (with padding) —
  verified against all six RFC test vectors. Secret encrypted at rest with
  AES-256-GCM (key derived from JWT_REFRESH_SECRET; no new required env).
  Only dependency added: `qrcode` for the enrollment QR data URL.
- **Enrollment (staff-only):** `POST /auth/2fa/setup` (QR + otpauth URL + secret,
  shown once), `POST /auth/2fa/confirm` (first-code verification → enabled +
  8 single-use recovery codes shown exactly once), `GET /auth/2fa/status`,
  `POST /auth/2fa/recovery-codes` (step-up protected), `DELETE /auth/2fa`
  (code-gated; wipes secret + codes).
- **Login integration:** 2FA-enabled staff get **no session** from
  `POST /auth/login` — a discriminated `twoFactorRequired` response carrying a
  2-minute, audience/purpose-scoped challenge JWT. `POST /auth/2fa/verify`
  (throttled 5/min) consumes TOTP **or** a recovery code (atomic single-use
  claim; TOTP steps replay-protected) and mints the real session. Suspended
  accounts are refused at both steps.
- **Admin overrides:** `GET/DELETE /admin/staff-2fa[/:userId]` — SUPER_ADMIN
  break-glass disable, audit-logged (`user.2fa.disable`); learners can never
  enroll.
- **Web:** `/admin/security` page (QR enrollment, recovery-code display, disable,
  staff table), login 2FA step with one-time-code input, full fa/en strings,
  demo-mode stubs.
- **Tests:** 34 new (RFC vectors, base32 round-trips, encryption tamper tests,
  enrollment flow, gating, replay protection, recovery-code burn, override
  permissions). Runtime smoke probes the full lifecycle against the built apps
  (28/28 PASS).

### ADM-2 — IDOR sweep (completed this session)

All 25 controllers inventoried; every object-level (`:id`/`:slug`) learner route
audited for ownership scoping; admin routes audited for privilege escalation.

**Verified clean (scoped correctly):** orders + invoices (×3 routes), payment
status, cart items, todos, tickets + replies, learner messages, readiness exam
attempts (`requireInProgress` userId-scoped), course-exam attempts
(`assertOwnAttempt`), course exams (enrollment-gated), roadmaps, assessments,
challenge submissions (`where { id, userId }`), competitions, media (signed
lesson-video JWT binds user+lesson+filename, path traversal via `resolveUnderRoot`),
public test banks (grading keys stripped), invoice HTML (owner-checked).

**Admin escalation paths verified:** role change and access matrix are
SUPER_ADMIN-only, last-super-admin demotion blocked, suspended/banned targets
protected, section-level `@AdminAccess('users','edit')` gating on top of RBAC.

**Gap found & fixed (payments, money path):**
unauthenticated gateway callbacks previously needed an `authority` (gatewayRef)
proof only on the FAILURE path — a forged `status=OK` with just a payment id
would complete a dev/sandbox provider payment (dev verify always succeeds
outside production). The gate is now **fail-closed for all unauthenticated
callbacks** (success and failure); authenticated callbacks remain
ownership-checked + server-side provider-verified. GET callback also gained
IDPay `id`/`order_id` query mapping so real IDPay browser redirects still pass.
3 new regression tests (no-authority success, mismatched authority,
provider-verify-never-reached assertion).

### AUTH-4 — password reset & change-password (implemented this session)

- **Data:** `PasswordResetToken` model + migration — SHA-256 digest only (raw token
  lives solely in the emailed link), `usedAt` single-use marker, 30-min expiry,
  cascade FK, lookup indexes.
- **API:** `POST /api/auth/forgot-password` (rate-limited 3/min; uniform success
  response — unknown/malformed/capped emails are indistinguishable; per-account
  email-bomb cap of 3/10min, enforced silently; older tokens invalidated),
  `POST /api/auth/reset-password` (shape-check before DB lookup, atomic
  single-use claim inside a transaction, bcrypt(12) re-hash, **all** refresh
  tokens revoked, suspended/banned accounts refused), `POST /api/auth/change-password`
  (JWT-guarded, current-password verified, new≠current enforced, revokes other
  devices only — current session survives; OTP-only accounts get a clear
  "set a password first" error).
- **Email:** `sendPasswordReset` Persian-first template (RTL, bilingual fallback,
  escaped link, no token in logs) + `send()` now returns sent/skipped/failed so the
  dev-only fallback (link logged outside production when SMTP is missing) is precise.
- **Web:** `/forgot-password` (enumeration-safe success state),
  `/reset-password?token=…` (client shape check, invalid-link and success states),
  change-password card on `/dashboard/profile`, forgot link on the login page;
  full fa/en i18n; demo-mode mirrors for all three calls.
- **Tests:** 18 new unit tests (`auth.service.password.spec.ts`) covering
  enumeration protection, email cap, hashed-at-rest tokens, expiry/used-token
  rejection, suspension refusal, atomic replay race (loser changes nothing),
  session-revocation semantics, and the no-log-in-production guarantee. Runtime
  verified end-to-end by `scripts/smoke.sh` (register → forgot → reset from
  logged link → old-password 401 → new login → wrong-current 401 → change →
  final login).

## Audit backlog (remaining, by priority)

### EXAM-3 — exam question snapshots (implemented 2026-09-26)

- **Migration `20260926120000_exam_question_snapshots`:** nullable
  `CourseExamAttempt.questionSnapshot` and `ReadinessAttempt.questionSnapshot`
  jsonb columns (18 migrations total).
- **Pin at start:** starting an exam writes the full question payload (course
  exam) or the resolved bank questions (readiness) onto the attempt.
- **Serve + grade from the snapshot:** resume and submit paths read the pinned
  questions — admin edits to a live exam/bank can no longer change what a
  learner sees or how an in-flight attempt is graded.
- **Legacy fallback:** attempts with a null snapshot (pre-migration rows) keep
  resolving against the live payload/bank.
- **Tests:** 7 new specs (pinning, snapshot-served resume, snapshot-based
  grading after live edits, legacy fallback) across both services — suite now
  132 api / 209 total.

Also this session: verified **PAY-3b** (`POST /admin/payments/:id/refund`),
**CI-1** (`security.yml`: pnpm audit + gitleaks + CodeQL, SHA-pinned) and
**CI-2** (Redis-backed `RateLimitStorageProvider`, fail-open) were already
implemented — the backlog docs were stale; both docs refreshed. Lint warning
(`statusUpper`) fixed; production build + runtime smoke re-run end-to-end
(all probes PASS, API `/api/health` reports `database: up`).

| ID | Sev | Item |
| --- | --- | --- |
| EXAM-4 | P1 | Unlimited course-exam attempts — needs a product policy (retake limit) |
| ADM-1 | P1 | Permission matrix duplicated frontend/backend — frontend should only consume server-issued access |
| CHAL-3 | P1 | `Challenge` model unused by the submission flow |
| AUTH-6 | P2 | `register` returns `ConflictException('Email already registered')` → enumeration |
| PAY-5 | P2 | Payment completion has a single-winner claim but no transactional outbox |
| ADM-3 | P2 | AdminAuditLog coverage of all sensitive actions incomplete |
| FE-1 | P2 | Access token in `sessionStorage` — move to HttpOnly cookie pattern long-term |
| DB-1 ledger | P2 | Wallet ledger table exists but balance has no enforced invariant/consumption model |
| CHAL-2 sandbox | P2 | Scoring is heuristic/static (no server-side execution) — sandbox model when dynamic scoring is needed |

Closed this session: EXAM-3 (question snapshots), PAY-3b (admin refund — was
implemented, docs stale), CI-1 (security.yml — verified), CI-2 (Redis throttler
storage — verified). ADM-2 (IDOR sweep) and DB-2/3/4 were closed in earlier
sessions.

## Environment notes (dev)

- `.env.docker` was missing JWT secrets in this worktree → generated locally via
  `crypto.randomBytes(48)` (git-ignored; never committed).
- Docker compose interpolation reads the **root** `.env`, not `.env.docker`
  (the latter is only a runtime `env_file` for the api container).
- Long-lived dev servers cannot persist between tool calls in this workspace;
  use `scripts/smoke.sh` for runtime verification.
- Known cosmetic quirk (pre-existing): API logs `running on http://localhost:0/api`
  in `pnpm dev` because `PORT` is unset in dev `.env`; prod/compose set it explicitly.
