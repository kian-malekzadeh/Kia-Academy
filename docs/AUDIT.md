# Production Readiness Audit — Phase 0

Full-repository audit (architecture, security, data integrity, payments, exams,
challenges, admin, frontend). Findings are classified by severity and fixed in
phases (see the master hardening plan). This document is updated as items land.

Severity: **P0** critical (security / data loss / financial integrity) ·
**P1** high (production blocker) · **P2** medium · **P3** low.

## Confirmed findings

### Authentication & sessions
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| AUTH-1 | P0 | `JwtStrategy.validateUser` and `validateRefreshToken` never check `user.status`; a suspended/banned user keeps API access until the access token (≤15 min) expires | **fixed (Phase 1)** |
| AUTH-2 | P0 | `login` and `verifyOtp` do not reject suspended/banned accounts — a banned user can mint fresh sessions | **fixed (Phase 1)** |
| AUTH-3 | P0 | Admin role change does not revoke the target user's refresh tokens — old sessions keep a changed role's refresh path alive | **fixed (Phase 1)** |
| AUTH-4 | P1 | No password reset / forgot-password flow; no change-password endpoint (email+password accounts cannot recover) | backlog |
| AUTH-5 | P1 | No 2FA/MFA for admin accounts | backlog (Phase 2) |
| AUTH-6 | P2 | `register` returns `ConflictException('Email already registered')` → account enumeration | backlog |

Positives already present: refresh tokens stored as SHA-256 digests, rotation via
delete-claim (reuse rejected), HttpOnly SameSite refresh cookie, per-phone OTP
flood caps, bcrypt cost 12, throttled auth endpoints.

### Payments
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| PAY-1 | P0 | `completePayment` transition guard is `status: { not: 'COMPLETED' }` → `FAILED→COMPLETED` and `REFUNDED→COMPLETED` are accepted, violating the payment state machine | **fixed (Phase 3)** |
| PAY-2 | P0 | No webhook event idempotency table — Stripe replays rely solely on payment status | **fixed (Phase 3)** |
| PAY-3 | P1 | `PaymentStatus` enum lacks `CANCELLED`/`PROCESSING`; refund flows cannot be modelled properly | **enum fixed (Phase 3)**; refund admin endpoint still missing (P1 backlog) |
| PAY-4 | P1 | Side effects (entitlements, invoice) run outside a DB transaction; email failure cannot rollback payment (good) but entitlement+order+invoice are not atomic | **fixed (Phase 3)** — completion claim + order PAID + invoice + entitlements now commit in one transaction; email/cart outside |
| PAY-5 | P2 | Client verify callback and webhook both call complete — protected by single-winner claim (good) but no outbox | backlog |

### Exams
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| EXAM-1 | P0 | `submitExam` accepts submissions after `endsAt` (no expiration check on the submit path) | fixed (Phase 5) |
| EXAM-2 | P0 | No DB constraint enforcing one active attempt per user/exam — race can create parallel attempts | fixed (Phase 5) |
| EXAM-3 | P1 | Exam questions stored as JSON strings without version pinning on the attempt | backlog |
| EXAM-4 | P1 | `CourseExamAttempt` allows unlimited attempts with no constraint | backlog |

### Challenges
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| CHAL-1 | P0 | Submissions carry no `challengeId`; leaderboard points/rank updated non-atomically and overwritten rather than accumulated | fixed (Phase 6) |
| CHAL-2 | P0 | No rate limit on submission endpoint; no sandboxed execution model (scoring is heuristic/static — no user code executes server-side, which limits blast radius but the architecture must stay explicit) | fixed (rate limit) / sandbox backlog |
| CHAL-3 | P1 | `Challenge` model exists but is unused by the submission flow | backlog |

### Database
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| DB-1 | P0 | `WalletTransaction.paymentId` has no FK; wallet balance is a bare mutable `Int` with no ledger invariant | fixed (FK) / ledger backlog |
| DB-2 | P1 | Stringly-typed states (`ExamAttempt.status`, `Order.source`, `User.status`, `Entitlement.resourceType`) — validated only in app code | backlog (Phase 4) |
| DB-3 | P1 | JSON payloads persisted as `String` (answers, questions, modules, pricing, invoice line items) | backlog (Phase 4) |
| DB-4 | P2 | No soft-delete strategy for financial/audit records | backlog (Phase 4) |

### Admin & authorization
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| ADM-1 | P1 | Permission matrix duplicated frontend/backend; frontend must only consume server-issued access | backlog (Phase 2/9) |
| ADM-2 | P1 | Object-level authorization (IDOR) not systematically audited across controllers | backlog (Phase 2/8) |
| ADM-3 | P2 | Admin audit log exists (AdminAuditLog) — coverage of all sensitive actions needs completion | backlog |

### Infrastructure / CI
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| CI-1 | P2 | No dependency/secret/security scan in CI; `pnpm audit` absent | backlog (Phase 15) |
| CI-2 | P2 | Throttler is in-memory — fine single-instance; distributed limiting needs Redis at scale | backlog (Phase 8) |
| CI-3 | P3 | Demo mode (`NEXT_PUBLIC_DEMO_MODE`) is explicit and cannot silently enable — acceptable | verified |

### Frontend
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| FE-1 | P2 | Access token in `sessionStorage` (not localStorage) — acceptable; move to HttpOnly cookie pattern long-term | backlog |
| FE-2 | P2 | `LessonPlayer` uses `dangerouslySetInnerHTML` — sanitize audit pending | backlog (Phase 13) |
| FE-3 | P3 | `markdown.ts` escapes all input before tag emission — verified safe pattern | verified |

## Phase order

Phase 1 auth/session revocation → Phase 3 payment state machine & webhook
idempotency → Phase 5 exam integrity → Phase 6 challenge integrity →
Phase 4 database integrity → then P1 phases per the master plan.
