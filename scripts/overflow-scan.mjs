/**
 * Scan key pages for horizontal overflow at mobile widths.
 * Usage: node scripts/overflow-scan.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const WIDTHS = [320, 360, 390, 430, 768];

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1200);
}

async function measure(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const iw = window.innerWidth;

    // Real user-facing scroll (with current overflow rules)
    const liveOverflow = Math.max(html.scrollWidth, body.scrollWidth) - iw;

    // Unclip to find true layout offenders
    const touched = [];
    const unlock = (el) => {
      if (!el) return;
      touched.push([el, el.style.overflowX, el.style.overflow]);
      el.style.overflowX = 'visible';
    };
    unlock(html);
    unlock(body);
    document
      .querySelectorAll(
        '.site-aurora, .material-studio-root, .panel-shell, .panel-content, .page-content, .site-main, .admin-shell, .admin-main, .admin-content, main, #__next',
      )
      .forEach(unlock);

    const uncoveredOverflow = Math.max(html.scrollWidth, body.scrollWidth) - iw;
    const offenders = [];

    document.querySelectorAll('body *').forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      // Skip intentionally overflowing decorative layers / scroll regions
      if (
        el.closest('.site-aurora') ||
        el.classList.contains('site-aurora-a') ||
        el.classList.contains('site-aurora-b') ||
        el.classList.contains('site-aurora-c') ||
        el.classList.contains('bg-orb') ||
        el.classList.contains('orb-a') ||
        el.classList.contains('orb-b')
      ) {
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 1 && r.height < 1) return;
      const overRight = r.right - iw;
      const overLeft = -r.left;
      const over = Math.max(overRight, overLeft);
      if (over > 2) {
        const cls =
          typeof el.className === 'string'
            ? el.className.trim().split(/\s+/).slice(0, 5).join('.')
            : el.tagName.toLowerCase();
        const parentScroll =
          style.overflowX === 'auto' ||
          style.overflowX === 'scroll' ||
          el.parentElement &&
            ['auto', 'scroll'].includes(getComputedStyle(el.parentElement).overflowX);
        offenders.push({
          sel: cls || el.tagName.toLowerCase(),
          over: Math.round(over * 10) / 10,
          left: Math.round(r.left),
          right: Math.round(r.right),
          w: Math.round(r.width),
          parentScroll: Boolean(parentScroll),
          pos: style.position,
        });
      }
    });

    offenders.sort((a, b) => b.over - a.over);
    const seen = new Map();
    for (const o of offenders) {
      // Prefer non-scroll-parent offenders (true page overflow causes)
      const key = o.sel;
      const prevO = seen.get(key);
      if (!prevO || (!o.parentScroll && prevO.parentScroll) || o.over > prevO.over) {
        seen.set(key, o);
      }
    }

    for (const [el, ox, o] of touched) {
      el.style.overflowX = ox;
      el.style.overflow = o;
    }

    return {
      iw,
      liveOverflow,
      uncoveredOverflow,
      htmlOverflowX: getComputedStyle(html).overflowX,
      bodyOverflowX: getComputedStyle(body).overflowX,
      top: [...seen.values()]
        .filter((o) => !o.parentScroll)
        .slice(0, 15),
      scrollParents: [...seen.values()].filter((o) => o.parentScroll).slice(0, 8),
    };
  });
}

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const suites = [
  { name: 'guest', pages: ['/', '/material', '/education', '/login', '/contact'], auth: null },
  {
    name: 'learner',
    pages: ['/dashboard', '/assessment', '/courses', '/roadmap', '/readiness'],
    auth: { email: 'alex@kia.academy', password: 'KiaAcademy123!' },
  },
  {
    name: 'admin',
    pages: ['/admin', '/admin/finance', '/admin/users'],
    auth: { email: 'admin@kia.academy', password: 'KiaAcademy123!' },
  },
];

const results = [];

for (const suite of suites) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      locale: 'fa-IR',
    });
    const page = await context.newPage();
    if (suite.auth) {
      try {
        await login(page, suite.auth.email, suite.auth.password);
      } catch (err) {
        results.push({ suite: suite.name, width, error: `login: ${err.message}` });
        await context.close();
        continue;
      }
    }

    for (const path of suite.pages) {
      try {
        await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(600);
        const m = await measure(page);
        if (m.liveOverflow > 1 || m.uncoveredOverflow > 1 || m.top.length) {
          results.push({ suite: suite.name, path, width, ...m });
        }
      } catch (err) {
        results.push({ suite: suite.name, path, width, error: String(err.message || err) });
      }
    }
    await context.close();
  }
}

await browser.close();

const live = results.filter((r) => (r.liveOverflow || 0) > 1);
const uncovered = results.filter((r) => (r.uncoveredOverflow || 0) > 1);
console.log(JSON.stringify({ liveCount: live.length, uncoveredCount: uncovered.length, results }, null, 2));
