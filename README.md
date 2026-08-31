<div align="center">

<img src="apps/web/public/brand/logo.svg" alt="Kia Academy — کیا آکادمی" width="140" />

# Kia Academy · کیا آکادمی

**Adaptive learning platform for Iranian developers — Persian-first, RTL-native**

[![CI](https://github.com/kian-malekzadeh/Kia-Academy/actions/workflows/ci.yml/badge.svg)](https://github.com/kian-malekzadeh/Kia-Academy/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.13-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**[🌐 Live Demo](https://kian-malekzadeh.github.io/Kia-Academy/)** &nbsp;·&nbsp;
**[📦 Repository](https://github.com/kian-malekzadeh/Kia-Academy)** &nbsp;·&nbsp;
**[🐞 Issues](https://github.com/kian-malekzadeh/Kia-Academy/issues)** &nbsp;·&nbsp;
**[🔒 Security Policy](SECURITY.md)**

</div>

---

Kia Academy is a production-grade adaptive learning platform targeting learners in Iran.
Guests land on a minimal Persian hero, explore **Material Studio**, then follow a guided
journey: phone OTP → profile → free goal assessment → free readiness test → personalized
roadmap → paid bundle checkout → lesson player. The learner experience is entirely
**فارسی / RTL**; staff sign in with email + password and manage everything from a
role-scoped admin panel.

> 💡 The live demo runs in **in-browser demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`): the
> full UI works against mock data with zero backend required — perfect for exploring the
> product before self-hosting.

## ✨ Highlights

| Area | Details |
| --- | --- |
| 🇮🇷 **Persian-first UX** | Full-fa RTL UI, Iranian phone OTP signup, province/city picker, prices shown in تومان over IRR storage |
| 🧭 **Adaptive engine** | Goal assessment → readiness exam grading → per-track roadmap with module levels |
| 🎓 **Lesson player** | Markdown lessons, video, notes and an HTML/CSS/JS playground |
| 👛 **Learner panel** | Wallet, orders/invoices, exams, courses, bootcamp rank, todos, tickets, messages, profile |
| 🛡️ **Admin governance** | `SUPER_ADMIN` vs matrix-limited `ADMIN` permissions, editable test banks, site settings catalog |
| 🔍 **SEO-ready** | Dynamic sitemap/robots, JSON-LD, canonical URLs, OG/Twitter cards, noindex on private routes |
| 🔒 **Hardened by design** | Helmet+CSP headers, short-lived split JWT secrets, hardened password hashing, rate limiting, upload allow-lists |

## 🎯 Learner Journey

```
Landing (/) ──► Material Studio (/material)          free, no account
        │
        ▼
Education (/education)      phone OTP (09xxxxxxxxx)  ← always phone-first
        │
        ▼
Profile complete            firstName/city/province/email
        │
        ▼
Assessment (/assessment)    first-goal wizard        free
        │
        ▼
Readiness Test (/readiness/test)   server-graded     free · silent scoring
        │
        ▼
Results (/readiness/results) ─► Roadmap (/roadmap) ──► Checkout ──► /learn
```

## 🏗️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, lucide-react, local Persian fonts (YekanBakh/Pelak) |
| Backend | NestJS 11, Passport JWT, class-validator, @nestjs/throttler, helmet |
| Database | PostgreSQL 16 + Prisma ORM 6 (single baseline migration) |
| Shared | `@kia-academy/shared` — types, banks, grading, entitlements, validators (built first) |
| Quality | ESLint flat config, Prettier, Vitest (shared) + Jest (api), Playwright e2e |
| Infra | Docker multi-stage images, GitHub Actions CI, GH Pages static export (demo mode) |

## 📐 Architecture

```text
kia-academy/
├── apps/
│   ├── web/            # Next.js 16 — port 3000, fa locale, proxies /api → API
│   │   ├── src/app/          # route segments (material, education, dashboard…)
│   │   ├── src/features/     # modular features (material studio, …)
│   │   └── public/brand/     # logos used across the app + this README
│   └── api/            # NestJS 11 — port 3001 under /api
│       ├── src/<domain>/     # auth, payments, courses, assessments, admin…
│       └── prisma/
│           ├── schema.prisma       # 30+ models, enum-driven
│           └── migrations/         # single professional init_baseline
├── packages/shared/    # workspace lib — MUST build before api/seed
├── docker/             # entrypoint scripts (wait-for-db, migrate, seed)
├── docs/               # architecture + catalogs + design system
└── scripts/            # utility tooling
```

**Request flow:** Browser → Next.js (`rewrites /api/*`) → NestJS guards chain
(`JwtAuthGuard` → `RolesGuard` → `AdminAccessGuard`) → DTO validation → Prisma →
PostgreSQL. Lesson videos are served through signed authenticated media URLs — never a
public static dump.

## 🚀 Getting Started

**Prerequisites:** Node **≥ 22.13**, pnpm via Corepack, PostgreSQL 16 (local or Docker).

```bash
git clone https://github.com/kian-malekzadeh/Kia-Academy.git Kia-Academyemy
cd Kia-Academyemy

corepack enable && corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile        # also generates the Prisma client

# environment templates (git-ignored)
cp apps/api/.env.example apps/api/.env          # set DATABASE_URL + JWT secrets
cp apps/web/.env.example apps/web/.env.local    # leave NEXT_PUBLIC_DEMO_MODE unset for real API

pnpm docker:db                        # or run your own Postgres 16
pnpm --filter @kia-academy/shared build
pnpm db:migrate                       # applies init_baseline migration
pnpm db:seed                          # catalog + banks + starter users

pnpm dev                              # web :3000 · api :3001 · health /api/health
```

> 🔐 Development seeding creates starter accounts (including admin & learner) for local
> testing only. **No real credentials are ever committed** — production passwords are
> generated at deploy time and rotated; see [`SECURITY.md`](SECURITY.md).

> Playwright one-time setup for e2e:
> `pnpm --filter @kia-academy/web exec playwright install chromium`

### Run modes

| Mode | Command | Notes |
| --- | --- | --- |
| A — Local Postgres | steps above with your own DB URL | no Docker needed |
| B — Docker Postgres only | `pnpm docker:db` then `pnpm dev` | hot-reload DX (recommended) |
| C — Full Docker stack | `pnpm docker:setup && pnpm docker:up` | production-like containers |
| D — Static Pages export | `pnpm build:pages` | demo mode, basePath `/Kia-Academy` |

## 🧰 Scripts

| Root script | Description |
| --- | --- |
| `pnpm dev` | Web + API concurrently (hot reload) |
| `pnpm build` | shared → api → web (ordered automatically) |
| `pnpm lint` / `pnpm typecheck` | ESLint flat config / tsc project references |
| `pnpm test` | Jest (api) + Vitest (shared) suites |
| `pnpm test:e2e` | Playwright end-to-end flows |
| `pnpm db:migrate` / `db:migrate:deploy` | Dev migrate / non-interactive apply |
| `pnpm db:seed` | Idempotent upserts (catalog, banks, settings, starter users)
| `pnpm docker:*` | db/db:down/db:reset/setup/up/down/logs/build |

## 🔐 Environment Variables

Everything ships as templates — only `*.example` files are committed.

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | api `.env` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | api `.env` | ≥32 chars; weak values rejected in production by Joi schema |
| `CORS_ORIGIN` | api `.env` | Public web origin, credential-safe single origin |
| `OTP_DEV_EXPOSE` | api `.env` | ⚠️ dev-only flag returning `devCode`; must stay unset in production |
| `NEXT_PUBLIC_API_URL` / `API_PROXY_TARGET` | web `.env.local` | Same-origin proxy in local/Docker; external origin on static hosting |
| `STRIPE_SECRET_KEY`, SMTP_* | api `.env` | Optional providers (IRR gateways ZarinPal/IDPay supported natively) |

## 🧪 Quality Gates

- ✅ ESLint + `tsc --noEmit` across all three workspaces
- ✅ Jest API suite (auth, payments, guards…) + Vitest unit suites (grading, currency, geo)
- ✅ CI (`.github/workflows/ci.yml`) boots a real Postgres service → migrate → lint → typecheck → test → build on every push/PR to `main`
- ✅ Dependabot weekly dependency & action updates

## 🛡️ Security Posture

| Control | Implementation |
| --- | --- |
| AuthN/AuthZ | Short-lived access JWT + revocable refresh cookie, each with an independent rotating secret; bcrypt-hashed credentials |
| Rate limiting | Enforced per-route limits on auth/OTP/global traffic to slow credential abuse |
| Headers | Helmet (api) + full security headers incl. CSP/HSTS/XFO on Next responses |
| Validation | class-validator whitelist + forbidNonWhitelisted; Joi env schema at boot |
| Uploads | MIME allow-lists, size caps, safe-path helper, authenticated media URLs |
| Payment integrity | In-app free confirmation blocked in production; gateway callbacks verify through provider APIs |

Report vulnerabilities responsibly per [`SECURITY.md`](SECURITY.md) — please use private advisories instead of public issues.

## ☁️ Deployment

- **GitHub Pages (demo mode):** the `Deploy GitHub Pages` workflow builds the demo app on every push to `main` (`NEXT_PUBLIC_DEMO_MODE=true`, basePath `/Kia-Academy/`) and deploys it automatically — live at <https://kian-malekzadeh.github.io/Kia-Academy/>. Local preview: `pnpm build:pages` → serve `apps/web/out`.
- **Self-host Docker:** hardened multi-stage images (`docker build --target api|web`) running as a non-root `node` user, OCI-labelled, with built-in healthchecks; Compose adds `init: true` and `no-new-privileges` on app containers. See run mode **C** above.
- **CI:** every commit is validated against a live Postgres before merge

## 📚 Documentation

| Document | Contents |
| --- | --- |
| [`docs/REBUILD_ARCHITECTURE.md`](docs/REBUILD_ARCHITECTURE.md) | Product shape and architecture decisions |
| [`docs/ADMIN_SETTINGS_CATALOG.md`](docs/ADMIN_SETTINGS_CATALOG.md) | Every controllable admin setting |
| [`docs/LEARNER_DASHBOARD.md`](docs/LEARNER_DASHBOARD.md) | Dashboard section-by-section spec |
| [`docs/design-system/MASTER.md`](docs/design-system/MASTER.md) | UI design system source of truth |
| `docs/*.docx` | Generated guidebook / feature inventory |

## 🤝 Contributing

1. Fork → feature branch from `main`
2. Keep all gates green: `pnpm lint && pnpm typecheck && pnpm test`
3. Conventional Commits style (`feat:`, `fix:`…) preferred

## 📄 License

[MIT](LICENSE) © [Kian Malekzadeh](https://github.com/kian-malekzadeh)

