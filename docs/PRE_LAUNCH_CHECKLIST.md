# Pre-Launch Checklist — Kia Academy

Order matters: infrastructure → data → money → content → go/no-go.
Security deep-dive lives in [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md).

## 1. Infrastructure

- [ ] PostgreSQL 16 reachable only from private network; automated backups verified (restore drill once)
- [ ] DNS + HTTPS live on final domains (API and Web); force-HTTPS redirect at edge
- [ ] Env files generated from examples with production values (`apps/api/.env`, `apps/web/.env.local`, `.env.docker`)
- [ ] `docker compose config -q` passes; containers healthy (`docker compose ps`)
- [ ] Resource limits acceptable under expected load (compose defaults: api 768M, web 512M)

## 2. Database & migrations

- [ ] `pnpm db:migrate:deploy` (never `migrate dev`) applied against prod DB
- [ ] Seed accounts disabled: `SEED_DATABASE=false`; change/remove `admin@kia.academy` + demo users if seeded
- [ ] First super-admin created with a strong, unique password; second admin configured as backup

## 3. Auth & user flow (smoke test on prod build)

- [ ] Phone OTP login end-to-end with real Kavenegar template; codes arrive, expire in 5 min, single-use
- [ ] No `devCode` in response payloads; OTP retry/backoff messages localized (fa)
- [ ] Profile completion gate works (TopBar/Footer hidden pre-registration; assessment phone-first)
- [ ] Email welcome + password reset paths verified with production SMTP

## 4. Payments (money path)

- [ ] Gateway credentials live (sandbox OFF); `settings.payment.callbackUrl/successUrl/failureUrl` point at HTTPS prod URLs
- [ ] Test purchase each product type: READINESS_TEST free-path, ROADMAP_BUNDLE with `?roadmapId=…`, COURSE (direct + cart)
- [ ] Real gateway verify success AND decline path both land correctly (`/checkout/success|cancel`)
- [ ] Invoice numbering, IRR→تومان display, and PDF/print rendering correct
- [ ] Refund/chargeback runbook written down (who, how, SLA)

## 5. Content & UX

- [ ] Seed courses/lessons have real `videoUrl`s or placeholders removed; lesson player streams with entitlements enforced (403 for guests)
- [ ] Readiness test scoring silent until results page (no green/red during test)
- [ ] RTL layout spot-check on landing, dashboard, learn player (Safari+iOS included)
- [ ] Enamad id/code configured; seal renders in footers
- [ ] Legal pages (terms/privacy) populated and linked in footer

## 6. Observability & ops

- [ ] API logs shipped somewhere durable; error alerts routed (email/log service)
- [ ] Healthchecks wired to orchestrator restart policy; uptime monitor on `/api/health` and `/`
- [ ] Backup cron for Postgres + `uploads/` volume tested restore
- [ ] Rollback plan: previous image tag retained; migrations are backward-compatible one step back

## 7. CI gates green on release commit

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
- [ ] `security.yml` latest run green (audit / gitleaks / CodeQL)
- [ ] Version tag created; changelog updated

## Known deferred items (explicit human decisions)

- Blocking-mode dependency audit (currently advisory-only) — flip after first triage pass
- Optional: email-verification of profile email (currently trust-on-entry)
- Optional: WAF/CDN-level bot rules in front of `/api/auth/*`
