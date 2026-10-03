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
| `pnpm test` — 245/245 (shared 46, web 46, api 153) | ✅ |
| `pnpm build` (production, 344 static pages) | ✅ |
| `pnpm audit --prod` — 0 vulnerabilities (17 resolved via workspace overrides, 2026-09-29) | ✅ |
| Runtime smoke (`scripts/smoke.sh`, 29 probes incl. phone-only registration + OTP + password + 2FA flows) | ✅ |

## New this session

### Merge note — two different "AUTH-6"s reconciled (2026-10-03)

`main` and this session's branch had each closed a different audit item under
the same AUTH-6 label: `main` hardened the email `register` endpoint against
enumeration (anti-timing, silent verify link, welcome email), while this
session **removed** public email registration entirely (phone/OTP-only,
see AUTH-6 below). On merge, the phone-only product decision won: the
`register()` service method, its `register.dto.ts` endpoint and the five
dedicated register specs from the main-side hardening were dropped again,
along with the now-orphaned `DUMMY_HASH` timing absorber and
`issueEmailVerificationLink` helper. Everything from main that does not
depend on email registration is kept — the `type=verify` reset-token
semantics (used by profile email changes), EXAM-4 retake limits, the e2e/GHCR
pipelines, Docker fixes and backup/restore scripts.

### UX-2 — one account menu for sign out, color mode and language (implemented this session)

These three controls existed in **three** places at once: a standalone sign-out
button in the nav, `LanguageSelector` + theme toggle duplicated between the
desktop `top-right` cluster and the mobile burger sheet. All three now live in a
single place — the user-chip dropdown (`TopBar`), which is reachable on desktop
and on mobile:

- **خروج / Sign out** — moved out of `top-nav` into the dropdown (danger row).
- **حالت / Mode** — one row showing the *current* value («روشن»/«تیره», new
  `nav.modeLight` / `nav.modeDark` keys) instead of an anonymous ◐ glyph; the
  icon switches Sun/Moon so state is readable at a glance.
- **زبان / Language** — the `LanguageSelector` sits inside the dropdown, and its
  option list was re-skinned to **flow inline** (`position: static`, no float-out
  box-shadow panel) so it reads as one menu rather than a popover escaping a
  popover.
- **ویرایش اطلاعات کاربری** — profile editing (`/dashboard/profile`) joins the
  menu next to «همه دوره‌ها», reusing the same `panel.nav.profile` label the
  sidebar shows so the two never disagree. Menu order is now: courses ·
  profile ————— color mode · language ————— sign out.
- **Dead CSS removed:** every `.top-nav-tools` rule (layout.css + two
  responsive.css blocks) went with the element — the mobile sheet is now
  navigation only, verified in the DOM at 390px.
- **Duplicate nav entries removed:** «همه دوره‌ها» appeared three times (sidebar,
  top-right cluster, user menu). The `all-courses` item was dropped from
  `LearnerNav`, and the standalone `all-courses-btn` (with its whole
  `.top-right-tools` wrapper) was dropped from `TopBar` — that wrapper held
  nothing else once language and mode moved into the menu, so ~60 lines of dead
  CSS across `layout.css` + `responsive.css` went with it (including the
  `.user-chip-name` hide rule, which was re-scoped rather than deleted). The
  sidebar is now پنل · دوره‌های من · تیکت‌ها · پیام‌ها · پروفایل · متریال
  (+ جوایز), and the catalog is reachable from the user menu and the footer.
- The landing page keeps its own language/theme controls: guests have no user
  chip, and `SiteChrome` hides the whole bar for them.

### UX-1 — dedicated post-auth landing with only three doors (implemented this session)

Product decision: after registration + profile completion **and** after every
successful login, the user lands on a page that contains **nothing but three
buttons** — «کارفرما و فریلنسر»، «آموزش»، «متریال». The full dashboard panel stays
one click away (sidebar) but is no longer the landing surface.

- **New route `/home`** (`apps/web/src/app/home/page.tsx`): a centered,
  deliberately sparse page holding nothing but the three doors — the page
  heading was dropped on review so the choice is the only thing on screen.
  Gated by `RequireAuth learnerFlow`, so guests are pulled into the phone OTP
  flow and users with an incomplete profile are sent back to it.
- **`HubDoors`** (`apps/web/src/components/hub/HubDoors.tsx`): the three-door
  block was lifted out of the dashboard into a shared component, so `/home` and
  `/dashboard` can never drift apart.
- **One source of truth for the path:** `HOME_PATH` is exported from
  `apps/web/src/lib/postLoginPath.ts` and consumed by the landing redirect,
  `resolvePostLoginPath`, the education flow, `TopBar`'s logo and the freelance
  back button.
- **Entry points retargeted to `/home`:**
  - `/` — signed-in users with a completed profile `router.replace(HOME_PATH)`.
  - `resolvePostLoginPath` — learners now default to `/home` (including the
    `next=/` and rejected-open-redirect fallbacks). Staff still go to `/admin`,
    and learner **deep links are still honored** (`next=/roadmap` → `/roadmap`).
  - `education` `continueAfterProfile()` — no `next` deep link means profile
    completion lands on `/home` instead of the assessment page; its CTA copy
    became `education.start.homeCta` («مشاهده مسیرها») to match.
  - `TopBar` logo click — used to fork on `hasRoadmap` (`/dashboard` vs
    `/education`); now always `/home`, so the `useApp().hasRoadmap` dependency
    was dropped from that component.

**Follow-up — «آموزش» splits into two directions.** The education door now
opens `/tracks` instead of the course catalog, and that page holds exactly two
doors:

- **تکنولوژی** → `/tracks/technology`, which splits once more into **همه دوره‌ها**
  (`/courses`, the catalog) and **آزمون ارزیابی** (`/assessment`, the wizard →
  readiness test → roadmap). The assessment page's back button now points at
  `/tracks/technology` instead of `/education`, so the branch has no dead ends
  in either direction.
- **زبان‌های خارجی** → `/tracks/language`, an honest coming-soon page. There is
  no language content in the catalog today, so rather than ship a dead link it
  states plainly what is being built (level-adaptive, like the technology
  path), captures the demand through `/contact`, and offers the technology
  catalog as an alternative. This is the seam where a real language track
  (courses + a `language` track key + its own assessment) slots in later.
- **Doors keep working destinations:** `/freelance`, `/tracks`, `/material`,
  `/events`. `/freelance`'s back button points at `/home` instead of
  `/dashboard`.

### UX-3 — fourth department: events (implemented this session)

`/home` (and the dashboard panel) now carry **four** doors — employer/freelancer,
education, material and **events** — laid out two columns × two rows
(`.landing-doors--depts`; the old 3-column variant was renamed away since no
other page used it).

- **Horizontal breathing room.** `.hub` declared `padding: <block> 0 <block>`,
  and that shorthand zeroed the `.container` inline padding
  (`var(--space-6)` = 24px) for **every** hub page — so each door grid sat flush
  against both viewport edges. Switched to `padding-block`, which keeps the
  container gutter. `/home`, `/tracks`, `/tracks/technology`,
  `/tracks/language` and `/events` now all measure 24px inset on both sides
  (verified against `main`'s box, not `innerWidth`, since the panel rail eats
  one edge).
- **Brand name highlighted in the departments heading.** `HubDoors` wraps the
  academy name in `.dash-doors__brand` (brand colour) inside the otherwise
  plain `dashboard.doors.heading`. The heading stays **one** translated string
  and is split at render time around `common.brand`, because the two locales
  put the name in different positions (fa «دپارتمان‌های کیا آکادمی», en «Kia
  Academy departments») — and separate lead/tail keys could not express "no lead
  word": `createTranslator` tests `if (primary)`, so an empty-string part is
  treated as missing and silently falls back to the other locale (caught in the
  browser — Persian rendered «… کیا آکادمی departments»). If the brand string is
  ever absent from the heading, it degrades to plain text.
- **Fourth accent colour.** With four doors the existing three accents no
  longer gave the events door its own identity — mint/brand/amber were spoken
  for, and reusing the `danger` ramp would have signalled "error". A small
  `--sky-*` palette (`300/500/600` plus `--sky-tint` / `--sky-hairline`) was added
  in `base.css` for both themes, and `.door--events` / `.door-icon--sky` use it.
  The four doors are now mint · indigo · amber · sky, distinct in both themes
  (verified by computed `border-top-color` and icon background in light *and*
  dark).
- **`/events`** is a new hub for competitions, bootcamps, webinars and meetups.
  Three of its four tiles lead somewhere real: چالش‌ها و مسابقه‌ها → `/bootcamp`,
  بوت‌کمپ‌ها → `/bootcamp`, لیدربرد و جوایز → `/rewards`. The fourth
  (وبینار و میتینگ) is **not a link** — it is marked «به‌زودی», gets
  `cursor: default` and a neutral hover so it does not read as tappable, and
  the page closes with a `/contact` CTA plus the weekly challenges as the
  alternative. Same honesty rule as the foreign-language page: no dead links.
- **Header trimmed:** the `/events` head is now just the `<h1>` («رویدادها و
  مسابقات») — the eyebrow badge and subtitle paragraph were removed along with
  their now-unused `events.badge` / `events.sub` keys in both locales (the
  dashboard panel's `/dashboard/events` uses its own `panel.events.sub` and
  is untouched).
- Verified live in the preview: `/` → `/home`, education start step → `/home`,
  freelance back → `/home`, `/home` → `/tracks` → `/tracks/technology` →
  `/assessment`, and the language coming-soon page (a real layout bug was caught
  and fixed there: `.bento` is a 12-column grid, so bare `.tile` children
  collapsed to one column — they need `tile--half`).

**Navigation shape now in place:** `/home` (3 doors) → `/tracks` (technology ·
foreign languages) → `/tracks/technology` (all courses · assessment test). Every
leaf is a real page.

### UX-4 — back buttons return to the page you came from (implemented this session)

Every «بازگشت» control used to be a hard-coded path, so it lied about where the
user actually was: open `/bootcamp` from the home hub and its back button sent
you to `/dashboard`; in the lesson player it always dropped you on `/courses`
even when you arrived from another lesson. Back is now **history-first**, with
the old path kept only as a fallback.

- **`BackLink`** (`apps/web/src/components/layout/BackLink.tsx`) — a real
  `<a>` that intercepts only the plain left click and calls `router.back()`;
  middle-click, ctrl/cmd-click, the no-JS case and the fallback `href` all keep
  working. `PageBackButton` renders it, so all ~30 pages that already used the
  shared control became history-aware without touching their call sites.
- **Manual back links converted** to `BackLink`: `MaterialStudio` (`home-btn`),
  the two `education` flow `back-link`s, the lesson player's error-state link,
  and the four admin `admin-back` links (`courses/new`, `courses/[slug]/edit`
  ×2, `users/create`). Since it still renders an anchor, no CSS changed —
  including the `a.home-btn` rules in `material-studio.css`.
- **Why `document.referrer` is not enough:** it belongs to the *document
  load*, so it goes stale as soon as the user moves around the SPA (a page
  reached by three client-side hops still reports the original referrer, often
  empty). `lib/historyBack.ts` keeps a per-tab stack of visited paths in
  `sessionStorage`, fed by the new `HistoryTracker` (mounted once in
  `ClientProviders`, keyed on `usePathname`). Re-visiting a known path rewinds
  the stack instead of appending, so browser back/forward keeps it aligned with
  the real history; the stack is capped at 50 entries.
- **Fallback stays honest:** typed URLs, bookmarks, external links and
  links opened in a new tab produce no in-app history, so those pages fall back
  to their explicit `href` (e.g. `/events` → `/home`) rather than a dead back.
- Verified live: `/home` → `/tracks` → `/tracks/technology` walks back
  `/tracks` → `/home`;  `/home` → `/bootcamp` (fallback `/dashboard`) walks back
  to `/home`; `/material` and a direct `/events` visit behave as described.
  `pnpm typecheck`, `pnpm lint`, `pnpm test` (242/242) and `pnpm build` green.

*Superseded on placement by UX-5 below: the `BackLink` mechanism and the
history stack stay, but the control is now rendered once by the shells instead
of once per page.*

### UX-5 — one back control, one fixed slot, one label (implemented this session)

The back control existed in ~30 places with different wording
(«بازگشت به پنل»، «بازگشت به دوره‌ها», «بازگشت به آرنا»…) and different
positions (top of the container, inside a card header, next to a timer, in the
Material Studio top bar, as the `actions` slot of a panel header). It is now
rendered **by the shells only**, so its position cannot drift:

- **One slot.** `SiteChrome` renders `PageBackButton` as the first child of
  `<main>`, above whatever the page renders; the admin shell renders it
  directly under the admin header, above `.admin-page-content`. The slot is
  styled once (`.page-back-wrap`: `max-width: var(--shell-max)`, centered,
  `padding: var(--space-5) var(--space-6) 0`), so the pill lands on the content
  column's inline start edge at the same offset on every page — measured
  identical (108×42 pill, same left inset, same top) on `/courses`, `/material`,
  `/contact`, `/tracks/technology`, `/dashboard/tickets` and at 390px width.
  Admin re-skins only the colours (`variant="admin"` → admin surfaces); the
  geometry is the same rule.
- **One label.** `PageBackButton` lost its `label` prop: the text is always
  `common.back` («بازگشت» / "Back"), so no page can word it differently.
- **Per-page copies removed** from 29 files (`PageBackButton` usages, the
  `education` / lesson-player `back-link`s, four admin `admin-back` links and
  the Material Studio `home-btn`), plus the 404 page's «بازگشت به خانه» CTA —
  that page now gets the standard control from the shell. Two now-dead
  variables went with them (`checkout`'s `backHref`, `roadmap`'s
  `testCompleted`).
- **Dead CSS deleted:** `.admin-back` (admin.css + its two entries in
  admin-contrast.css), `.back-link` (buttons.css + the education-page rule in
  auth.css), `.ch-top .page-back-wrap` (bootcamp.css) and every `.home-btn` /
  `.material-topbar` rule in `material-studio.css`. `not-found.tsx` keeps only
  its heading and copy.
- **Dead i18n removed** from both dictionaries (9 keys, fa/en kept in sync):
  `contact.backHome`, `lesson.backToCourses`, `readiness.gate.backAssessment`,
  `readiness.results.backTest`, `bootcamp.backDashboard`, `bootcamp.solver.back`,
  `roadmap.backResults`, `admin.courses.back`, `auth.forgotPassword.backToLogin`.
  `readiness.results.backDashboard` stays — it is a CTA, not the back control.
- **Roots are exempt** (`lib/pageBack.ts`): `/`, `/home` and `/admin` carry no
  back pill, because a back control there would only point at itself.
  Everything else — including `/dashboard`, `/login` and `/cart`, which had
  none before — has exactly one.
- **Fallbacks** are per-shell (`/` for the site, `/admin` for the admin panel)
  and only used when there is no in-app history. `/` is the right site target
  for both audiences: guests get the landing page, a signed-in learner is
  forwarded to the departments hub by the landing page itself.

### UX-6 — content never sits flush against the column edge (implemented this session)

Reported on `/courses`: the catalog was glued to both edges of the content
column. Root cause is the same class of bug UX-3 hit on `.hub` — page shells
that also carry `.container` declared vertical rhythm with the **padding
shorthand** (`padding: <block> 0 <block>`). `.container`'s gutter
(`padding-inline: var(--space-6)`) has the same specificity and loses to any
later shorthand with `0` on the sides, so the whole page lost its 24px gutter.

- **12 rules fixed** across 6 stylesheets, all switched to `padding-block` so
  `.container`'s inline padding survives: `.dash`, `.challenge-shell`,
  `.rewards` (bootcamp.css), `.catalog-shell`, `.lesson-shell`, `.legal-shell`
  (catalog-lesson.css), `.gate`, `.test-shell`, `.results` (readiness.css),
  `.result-shell` (roadmap.css), `.wizard-shell` (wizard.css), `.checkout-result`
  (checkout-result.css). `.auth-shell`, `.cart-shell` and `.checkout-shell` were
  already correct (their shorthands keep a non-zero inline value).
- **Mobile rule repaired:** at ≤640px the lesson studio dropped its gutter
  entirely (`padding-inline: 0`); it now tightens to `var(--space-3)` (12px)
  instead of reaching the edge.
- **Reason recorded where it bites:** `.container` in `base.css` now carries a
  comment explaining why shells must use `padding-block`.
- **Regression guard:** `src/styles/container-gutter.test.ts` collects every
  class rendered together with `.container` (parsed from the TSX), then asserts
  (a) `.container` keeps a non-zero inline gutter and (b) no such shell sets a
  `padding` shorthand or `padding-inline/left/right` that zeroes it. Verified it
  *fails* when the original `.catalog-shell` bug is reintroduced, then passes
  again with the fix in place.

### UX-7 — the top bar shows the brand mark alone on mobile (implemented this session)

On phones the top bar carried the full «KIA ACADEMY» wordmark next to the
language toggle, cart, avatar and burger — four controls plus a long wordmark in
one 390px row. The wordmark is now hidden for the whole mobile range, not just
below 360px:

- `responsive.css` (`max-width: 900px`, the project's mobile breakpoint — the
  same edge where the panel switches from the horizontal bar to the desktop
  sidebar): `.topbar .logo-text` is `display: none`. The now-redundant
  `max-width: 360px` `.logo-text` hide was removed.
- The mark itself is untouched and stays centred in the bar
  (`grid-column: 2`), so the brand still reads and still navigates home.
- **Accessibility:** with the text hidden the button would have had no
  accessible name, so the logo button carries `aria-label={BRAND_WORDMARK}` —
  same string, named in both modes.
- Verified in the preview at 390px (wordmark `display: none`, mark visible,
  label `KIA ACADEMY`) and at 1280px (wordmark still visible).

### UX-8 — one «تیکت‌ها» entry in the learner menu (implemented this session)

The panel sidebar had «تیکت‌ها» as an expandable group whose only submenu item
was «تیکت جدید» — a second way to reach a button the tickets page already shows.

- **Tickets is now a leaf link** to `/dashboard/tickets`
  ([LearnerNav.tsx](apps/web/src/components/layout/LearnerNav.tsx)); the sidebar
  is a flat list of four sections: پنل · دوره‌های من · تیکت‌ها · پیام‌ها. On
  `/dashboard/tickets/new` the single entry still shows as active (`is-active` +
  `aria-current="page"`, prefix match), so the user keeps their place.
- **Ticket creation is untouched:** the list page's «+ تیکت جدید» button
  (`app/dashboard/tickets/page.tsx`), the dashboard ticket card
  (`TicketsCard`) and the per-course link all still lead to
  `/dashboard/tickets/new`. The `panel.nav.newTicket` / `panel.nav.previousTickets`
  strings stay — they label those buttons, not the menu.
- **Dead group machinery removed** now that no section has children: the
  `NavItem` union, `openGroups` state + its effect, the `ChevronDown` /
  `ClipboardList` imports and the group branch of the render
  ([LearnerNav.tsx](apps/web/src/components/layout/LearnerNav.tsx)), plus
  `.learner-nav-group*`, `.learner-nav-label`, `.learner-nav-children`,
  `.learner-nav-chevron*` in [panel.css](apps/web/src/styles/panel.css) and the
  two compact-mode hide entries in [layout.css](apps/web/src/styles/layout.css).
- The desktop sidebar's icon-only compact mode needs no JS: `.panel-nav--compact`
  already hides `.learner-nav-text` in CSS, so the `compact` prop was dropped
  from `LearnerNav` and from the `TopBar` call site.
- Verified in the preview at 390px and 1280px: 4 flat entries, exactly one
  containing «تیکت», zero `.learner-nav-group*` elements in the DOM.

### UX-9 — the footer is rebuilt minimal (implemented this session)

The footer was the densest surface left in the product: a four-column grid
(brand + blurb + tagline + three headed link columns), a divider row and a
bottom row. Measured height: **308px** on desktop, **665px** on a 390px phone.

- **New shape** ([Footer.tsx](apps/web/src/components/layout/Footer.tsx),
  [footer-nav.css](apps/web/src/styles/footer-nav.css)): one flex row — brand,
  then every footer link inline (no group headings, no per-link icons), then the
  trust/copyright line. Gone: `.footer-main`, `.footer-brand p`,
  `.footer-tagline`, `.footer-nav-group`, `.footer-bottom` and the three
  media-query blocks that re-flowed them.
- **Navigation.** All nine destinations (پنل · دوره‌ها · ارزیابی رایگان ·
  آزمون آمادگی · نقشه راه من · ارنه بوت‌کمپ · تماس · حریم خصوصی · شرایط) were
  first kept inline here, then **removed entirely in UX-14**. The Enamad trust
  seal and the copyright stay on every screen.
- **Phone treatment:** centred three-line block, `padding-block: var(--space-4)`,
  20px mark, tight gaps; the «پلتفرم یادگیری تطبیقی» status label is dropped
  below 640px (marketing copy, not trust/legal), and at ≤360px the link gap
  tightens again. Measured: **150px** at 390px (−77%) and **102px** at 1280px
  (−67%).
- **Brand link now uses `HOME_PATH`** like the top-bar wordmark (UX-1 made it
  the single source of truth for «go home»), instead of the stale `/dashboard`.
- `padding-block` is used for the footer's own spacing — a `padding` shorthand
  here would zero the `.container` gutter and glue the footer to the column edge
  (the UX-6 failure mode).
- Dead i18n removed from both dictionaries (parity re-verified: 2363 keys each):
  `nav.footer.blurb`, `nav.footer.tagline`, `nav.footer.learning`,
  `nav.footer.legal`. `nav.footer.explore` stays as the links' `aria-label`.

### UX-10 — signing out always lands on the landing page (implemented this session)

Product rule: after sign-out the user goes straight to the first page (`/`).
The learner menu already did that, but the **admin** panel sent staff to
`/login?next=/admin`, and — worse — every sign-out raced the page it was on:
clearing the session made that page's auth gate redirect in the same tick, so
the sign-out was undone. Measured before the fix: `/dashboard` → **exit** →
`/education?next=%2Fdashboard`.

- **One destination, one flag.** `AuthProvider` gained `signedOut`: set by
  `logout()` before the session clears, cleared by the next successful sign-in
  (`applyLearnerState`) and by `finishSignOut()` once the landing page is on
  screen. `logout({ keepPage: true })` is the opt-out used by the login screen,
  where a learner session is swapped for staff credentials without navigating.
- **Gates stand down.** `RequireAuth`, `DashboardGate`, the inline gate in
  `/assessment` and the admin shell's login gate all skip their redirect while
  `signedOut`. The admin shell's ad-hoc `leavingToSiteRef` was removed in favour
  of the shared flag (one mechanism, and `useRef` with it).
- **The current page is unmounted during the transition** (`SiteChrome`): that
  is what actually disarms the *inline* gates that no shared component owns
  (`/dashboard`, `/dashboard/my-courses`, …) and it stops protected content from
  flashing after sign-out. `SiteChrome` also calls `finishSignOut()` when the
  landing route arrives, so the flag cannot stay stuck (a stuck flag would blank
  every later page).
- **Admin sign-out rows unified:** «خروج» and «بازگشت به سایت» both run
  `handleSignOut()` → `router.replace('/')`. The learner menu uses
  `router.replace('/')` too (not `push`), so Back cannot walk back into the
  signed-in panel.
- Verified live: `/dashboard` → **خروج** → single navigation to `/`, session
  cleared, guest landing rendered (hero + «ورود / ثبت‌نام»), no top bar. Signing
  back in restores the panel, its nav and the back pill.

### UX-11 — one shared page background (implemented this session)

Product rule: **every page shares one background.** Two aurora systems were
painting at once and page shells repainted over them, so routes drifted apart.
Measured before the fix: `body` carried `--gradient-aurora`
(`background-attachment: fixed`) *and* the fixed `.site-aurora` layer,
`.dash-panel` re-pasted the same gradient, and Material Studio sat on its own
opaque `radial-gradient(circle at top, …)` plus two `.bg-orb` blobs.

- **One owner.** `body` now paints only `background: var(--bg)`; the aurora
  wash belongs to `.site-aurora` (fixed, `inset: 0`, `z-index: var(--z-base)`),
  which `SiteChrome` renders on every non-admin route. Admin keeps its own dark
  shell and skips the layer. The duplicated `background-image` /
  `background-attachment: fixed` and the now-dead `--gradient-aurora` /
  `--gradient-hero` tokens (both themes) are gone.
- **Local repaints removed.** `.dash-panel` (learner panel) and
  `.material-studio-root` are transparent; the studio's `--ms-root-a/b`
  gradient and its `.bg-orb orb-a/orb-b` markup, CSS and `driftA/driftB`
  keyframes are deleted — its glass panels now read against the shared
  background in both themes.
- **Guard:** `apps/web/src/styles/page-background.test.ts` (7 tests) pins the
  invariant — `body` paints the base colour only, no second aurora token
  exists, `SiteChrome` wires `SiteAurora`, and none of the 19 page roots
  (`.dash-panel`, `.landing`, `.material-studio-root`, `.catalog-shell`, …) may
  declare a background. Re-adding a `body` gradient or a `.dash-panel` paint
  makes it fail (verified both).
- Verified live: a viewport-wide sweep (`backgroundColor`/`backgroundImage` on
  every element covering ≥90% of the viewport) reports exactly one painter on
  `/dashboard`, `/home`, `/courses`, `/contact`, `/roadmap` and
  `/learn/…` — `body` — plus the shared aurora layer, in light and dark, at
  1280px and 390px. No horizontal overflow, no nested page scroller on the
  studio. Gates: typecheck, lint, 252 tests (shared 46 · web 53 · api 153),
  build (353 static pages) all green.

### UX-12 — registration and sign-in land straight on the departments page (implemented this session)

Product rule: after the phone flow (mobile → OTP → profile) the learner goes
**directly** to `/home` (the departments page), and so does a plain sign-in. Two
extra steps used to sit in that path: the education flow ended on a «آماده‌اید»
confirmation card that needed a click, and `/login` defaulted its `next` param to
`/dashboard`, so signing in landed on the learner panel instead of `/home`.

- **Education flow** (`app/education/page.tsx`): the `start` step is gone. A
  single effect owns the onward navigation — as soon as the session reports a
  complete profile it resolves the destination and `router.replace`s to it
  (`?next=` when a gate sent the user here, otherwise `/home`), showing the
  loading card instead of flashing a stale form. Verified: phone → OTP (`123456`
  in dev) → profile lands on `/home` in one navigation, and `/education` opened
  by an already-registered user bounces to `/home`.
- **Login** (`app/(auth)/login/page.tsx`): `next` no longer defaults to
  `/dashboard`; a plain `/login` visit resolves to `HOME_PATH`, while an
  explicit `?next=` still wins (verified `/login?next=/roadmap` → `/roadmap`).
  Staff keep going to `/admin`.
- **One resolver, one place:** `resolveInternalNext()` was extracted in
  `lib/postLoginPath.ts` and now backs both `resolvePostLoginPath` and the
  education flow — same validation for `?next=` (single-slash internal paths
  only; `/`, `/login`, `//host` and absolute URLs fold into `/home`), so a
  `next` pointing back at `/education` cannot loop the flow. 4 new unit tests
  cover it (web suite 53 → 57).
- The four dead `education.start.*` keys are removed from both dictionaries
  (2358 keys each, parity still asserted by `i18n.test.ts`).
- Gates: typecheck, lint, 256 tests (shared 46 · web 57 · api 153), build (353
  static pages) all green.

### UX-13 — one card tile for every card, one colour per course (implemented this session)

Product rule: a card is the same object wherever it appears — same size, padding,
radius, shadow, hover and icon tile — and each course wears its own colour.
Before this the two families had drifted apart: department doors (`.door`) were
16:9-ish rounded panels with a 44px accent icon, while course cards
(`.catalog-card`) were plain white boxes with a small outlined pill, a three-per-
row grid at ~299px, and **every course in the same indigo**.

- **One tile, defined once** (`styles/base.css`): `.door, .catalog-card` share the
  surface, `padding: var(--space-5) var(--space-6)`, `--radius-xl`,
  `--shadow-sm`, the hover lift, a `13rem` height floor and the 44px accent icon
  tile. The accent is the only variable, supplied by a `tint--*` class —
  `brand | sky | mint | amber | rose | violet` — so a new card cannot invent its
  own box. Measured live on `/home` and `/courses`: 374px wide, radius 28px,
  padding 20px/24px, icon tile 44px (14px radius), title 28px — identical on
  both pages; heights follow the content, equal within a row.
- **Doors lost their private palette:** `.door--primary/--work/--material/--events`
  and `.door-icon--brand/--mint/--amber/--sky` are gone from both CSS and markup
  (12 tiles across `/home`, `/tracks`, `/tracks/technology`, `/events`,
  `HubDoors`); the accent now rides on the card. `.door-cta`/`.door-action` wear
  the tile accent, and `.dash-doors .landing-doors` no longer stretches past the
  48rem cap, so the panel copy of the doors is the same size as `/home`.
- **Course colours:** `lib/cardAccent.ts` hashes the course slug (FNV-1a) and
  hands out accents, skipping hues already taken *in that grid* — a course keeps
  its colour on `/courses` and «دوره‌های من», and no two cards on a page share one.
  5 unit tests cover stability, uniqueness and that every accent has a real
  `tint--*` class in `base.css`.
- **Course icons:** `CourseTileIcon` maps the free-form API icon word (`code`,
  `palette`, `briefcase`, …) to a lucide glyph so it fits the 44px square, with a
  two-letter/emoji fallback. The word used to overflow the tile (it was clipped
  mid-letter).
- **Panels kept out of it:** the course intro and the exam-result box used
  `.catalog-card` as a content panel; they are now `.catalog-panel` (same surface,
  no accent, no tile height floor).
- Verified live: `/courses` (2×2, HTML=mint, CSS=violet, JavaScript=sky,
  interview=amber), `/home`, `/dashboard`, `/tracks`, `/events`, light + dark,
  1280px and 390px with no horizontal overflow. Gates: typecheck, lint, 261 tests
  (shared 46 · web 62 · api 153), build (353 static pages) all green.

### UX-14 — the footer keeps only the brand and the trust line (implemented this session)

Product decision (asked and answered: remove the link navigation site-wide): the
footer's `<nav>` duplicated the top bar and the learner menu on every page, and on
a three-step signup form like `/education` it pushed the trust seal off the
bottom of the screen.

- **Gone:** `FOOTER_LINKS` and the whole `<nav className="footer-links">` block in
  [Footer.tsx](apps/web/src/components/layout/Footer.tsx), the `.footer-links` /
  `.footer-link` rules and their 640px + 360px media blocks in
  [footer-nav.css](apps/web/src/styles/footer-nav.css), and the nine dictionary
  entries that existed only for it (`nav.footer.explore`, `freeAssessment`,
  `courseLibrary`, `readinessTest`, `myRoadmap`, `bootcampArena`, `privacy`,
  `terms`, `contact` — removed from both locales; `copyright`, `status` and
  `enamad` stay).
- **What the footer is now:** brand at the inline-start, the Enamad badge +
  status + copyright at the inline-end (`justify-content: space-between`),
  centred and stacked on phones.
- Measured: desktop **102 → 69px**, phone **150 → 59px**; no horizontal overflow
  at 390px; the footer renders no `<nav>` on any route (verified on `/home`).
- **The legal pages stayed reachable.** `/privacy` and `/terms` were linked from
  the footer nav only, so removing it would have orphaned them; they now sit as
  two plain text links beside the copyright (`.footer-legal`, reusing the existing
  `legal.privacy.title` / `legal.terms.title` strings — no new keys). Say the word
  and they go too.
- The footer only ever rendered for registered users (`SiteChrome` gates it on
  `profileComplete`), so the guest landing page is unchanged.
- Gates: typecheck, lint, 261 tests (shared 46 · web 62 · api 153), build (353
  static pages) all green.

### AUTH-6 — phone-only public registration (implemented this session)

Product decision: **self-registration happens only through the mobile/OTP
flow** (`/education`: phone → OTP code → profile). Everything that allowed an
email+password sign-up is gone, end to end:

- **API:** `POST /auth/register` (controller), `AuthService.register()` and
  `dto/register.dto.ts` deleted → the endpoint answers **404**. No public path
  can create a password-holding learner account any more.
- **Web:** `apps/web/src/app/(auth)/register/page.tsx` is now a redirect to
  `/education` (old bookmarks/external links land on the phone flow instead of
  a 404); the login page's «ایجاد حساب» link points at `/education`;
  `AuthProvider.register`, `api.register` and `demoApi.register` removed;
  `/register` dropped from `robots.ts`.
- **Shared:** the now-dead `RegisterDto` type was removed from
  `@kia-academy/shared`.
- **Staff provisioning is unchanged:** admins still create account holders with
  email+password through `POST /admin/users` (admin panel), which is how staff
  and test accounts are made.
- **Login, password reset and 2FA stay intact** for accounts that do have a
  password (staff, admin-created users).
- `scripts/smoke.sh` now asserts `POST /auth/register → 404` and provisions its
  password-bearing smoke account through the admin API (29 probes, all green).
- i18n `auth.register.*` strings were intentionally left in the dictionary: the
  2FA copy the login screen renders (`auth.login.twoFactor*`) currently lives in
  that same object, so deleting the whole block would break the login screen.
- Note: the phone flow still collects an email in its profile step — it is a
  contact/receipt field, not a credential.

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

### Dependency audit closure (implemented 2026-09-29)

- **All 17 audit findings resolved** (10 high / 6 moderate / 1 low) via
  `pnpm-workspace.yaml` overrides: `mysql2 >=3.22.0` (prisma CLI dep, unused — the
  app connects through `@prisma/adapter-pg`), `multer >=2.4.0`, `nodemailer >=9.1.1`,
  `qs >=6.15.4`, `fast-uri >=4.1.4`, `sharp 0.35.5`.
- **CI-1 flip:** the `security.yml` dependency-audit job is now **blocking**
  (`continue-on-error` removed) at `--audit-level=high` — a new high+ advisory
  fails CI until triaged, closing the last "known deferred" pre-launch item.
- Backlog docs reconciled against the code: CHAL-3 (challenge FK on submissions),
  DB-1 (wallet CHECK constraint + transactional ledger), PAY-5 (accepted —
  single-winner claim + webhook idempotency suffice for single-instance),
  FE-1 (accepted — sessionStorage scoping is a deliberate XSS blast-radius
  trade-off; refresh token already HttpOnly).

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

### ADM-1 — server-issued admin access (implemented this session)

- **One resolver, shared everywhere:** `resolveStaffAdminAccess` in
  `packages/shared` — per-user override → custom role matrix → site template.
  The API's `buildAuthUser` (login/2FA/OTP/me payloads) and
  `ModeratorAccessService` (guard enforcement) both call it, so issuance and
  enforcement can never drift.
- **Custom-role gap fixed:** a custom role without its own matrix previously
  fell back to the client's default template instead of the site template —
  now resolved server-side exactly like ADMIN.
- **Client consumes, never derives:** `useAdminAccess` reads
  `user.adminPanelAccess` verbatim (SUPER_ADMIN gets no field = full access);
  removed `createDefaultSiteSettings` fallback and all local matrix logic.
- **Custom roles can reach the panel:** staff gates unified on shared
  `isStaffRole` (admin shell, login redirect, `resolvePostLoginPath`, TopBar
  entry point, 2FA page).
- **Users page seeds the editor from server values:** draft matrix = user
  override → role matrix → template, mirroring backend order.
- **Demo mode:** added a moderator persona (`moderator@kia.academy`) whose
  matrix is explicitly issued by the demo API — the UI still derives nothing.
- **Tests:** 5 shared resolver specs + 4 API issuance specs + 1 post-login
  custom-role spec — suite now 136 api / 219 total (was 132/209).

| ID | Sev | Item |
| --- | --- | --- |
| ~~EXAM-4~~ | P1 | **RESOLVED** — `CourseExam.maxAttempts` (default 3, admin-tunable 1–10); only SUBMITTED attempts consume budget; EXPIRED terminal |
| ~~ADM-1~~ | P1 | **RESOLVED** — frontend consumes only server-issued access via unified `resolveStaffAdminAccess` (see AUDIT.md) |
| ~~CHAL-3~~ | P1 | **RESOLVED** — submissions resolve + FK-enforce the `Challenge` row server-side and pin its version |
| ~~AUTH-6~~ | P2 | **RESOLVED, then superseded** — main hardened email register (enumeration-safe 409 + timing equalizer); on 2026-10-03 public email registration was removed entirely (phone/OTP-only), making the endpoint — and its hardening — moot. The `type=verify` reset-link semantics remain for profile email changes |
| ~~PAY-5~~ | P2 | **ACCEPTED** — single-winner completion claim + `PaymentWebhookEvent` idempotency cover exactly-once for single-instance; outbox only pays off with multi-writer fan-out |
| ~~ADM-3~~ | P2 | **RESOLVED** — full audit coverage; last gap (`contact.read`) closed |
| ~~FE-2~~ | P2 | **RESOLVED** — sanitize audit complete; escape-first renderer pinned by tag-vocabulary + injection tests |
| ~~FE-1~~ | P2 | **ACCEPTED** — access token in `sessionStorage` is a deliberate per-tab XSS blast-radius trade-off; refresh token already HttpOnly |
| ~~DB-1~~ | P2 | **RESOLVED** — `balanceCents` non-negative CHECK constraint; all mutations transactional with ledger rows |
| CHAL-2 sandbox | P2 | Scoring is heuristic/static (no server-side execution) — sandbox model when dynamic scoring is needed |

Closed this session: EXAM-4 (attempt caps), AUTH-6 (enumeration-safe register
+ email verification), ADM-3 (contact.read audit gap), FE-2 (sanitize audit
pinned by tests), CHAL-3 (challenge FK on submissions), DB-1 ledger invariant
(CHECK constraint + transactional ledger — verified pre-existing), CI-1 flip
(audit now blocking), dependency-audit closure (17→0 via overrides).
Accepted with rationale: PAY-5 (outbox — not warranted single-instance),
FE-1 (sessionStorage — deliberate trade-off). Previously closed: EXAM-3
(question snapshots), PAY-3b (admin refund), CI-1 (security.yml), CI-2
(Redis throttler storage), ADM-2 (IDOR sweep), DB-2/3/4.

### EXAM-4 / AUTH-6 / ADM-3 / FE-2 — backlog closure (implemented this session)

- **EXAM-4:** `CourseExam.maxAttempts` (migration `20260928100000`, default 3,
  DTO clamp 1–10, exposed on AdminCourseExam/CourseExamSummary). `startAttempt`
  counts only SUBMITTED attempts against the cap (403 `Attempt limit reached
  (n/m)` when exhausted); EXPIRED attempts became terminal — the previous
  resume-expired quirk let a learner restart an expired try forever; 5 specs.
- **AUTH-6:** `register` now catches the P2002 unique violation and returns a
  generic 409 — no `Email already registered` message, no session. A module-
  level `DUMMY_HASH` (bcrypt 12) absorbs the timing side-channel; a silent
  verification link is emailed to the true owner. Email verification reuses
  the AUTH-4 token infra (`ResetPasswordDto.type=verify` flips
  `emailVerified`), `completeProfile` email changes reset `emailVerified` and
  resolve conflicts via P2002 instead of a revealing findUnique; 8 specs.
  *(Superseded 2026-10-03: the whole email `register` endpoint was removed in
  favor of phone-only registration — see the merge note at the top; the
  `type=verify` token semantics survive for profile email changes.)*
- **ADM-3:** coverage sweep of all 33 admin mutation routes vs 31 audit
  entries — the single gap (`contact.read`) now records actor/target/
  before/after with request meta.
- **FE-2:** the two `dangerouslySetInnerHTML` sinks audited (layout JSON-LD
  already `\u003c`-neutralizes; LessonPlayer renders `markdownToHtml`). New
  test suite pins the emitted tag vocabulary (14 tags) and asserts no
  script/iframe/object/embed/style/onerror injection survives any block type,
  no `javascript:`/`data:` hrefs, and no attribute breakout.
- **CI additions:** `e2e.yml` (Playwright against production build + real
  Postgres, report artifact on failure, `E2E_PRODUCTION` webServer mode) and
  `docker-publish.yml` (GHCR publish of api/web images on main pushes and
  v* tags, SHA-pinned actions, GHA build cache).

## Environment notes (dev)

- `.env.docker` was missing JWT secrets in this worktree → generated locally via
  `crypto.randomBytes(48)` (git-ignored; never committed).
- Docker compose interpolation reads the **root** `.env`, not `.env.docker`
  (the latter is only a runtime `env_file` for the api container).
- Long-lived dev servers cannot persist between tool calls in this workspace;
  use `scripts/smoke.sh` for runtime verification.
- Known cosmetic quirk (pre-existing): API logs `running on http://localhost:0/api`
  in `pnpm dev` because `PORT` is unset in dev `.env`; prod/compose set it explicitly.
