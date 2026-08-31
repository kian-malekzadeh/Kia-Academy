import { test, expect } from '@playwright/test';

async function useLocale(page: import('@playwright/test').Page, locale: 'en' | 'fa') {
  await page.context().addCookies([
    {
      name: 'kia-academy-locale',
      value: locale,
      url: 'http://localhost:3000',
    },
  ]);
}

test.describe('Learner journey', () => {
  test.beforeEach(async ({ page }) => {
    await useLocale(page, 'en');
  });

  test('landing page shows education and material CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/learn|design|grow/i);
    const educationCta = page.getByRole('link', { name: /Learning path/i });
    await expect(educationCta).toBeVisible();
    await expect(educationCta).toHaveAttribute('href', '/education');
    await expect(
      page.getByRole('link', { name: /Material Studio/i }).first(),
    ).toBeVisible();
  });

  test('login page loads for staff', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign in to Kia Academy/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel(/Password/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });

  test('register offers email signup and phone-first path', async ({ page }) => {
    await page.goto('/register?next=%2Fassessment');
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
    // Phone-first journey stays the primary signup path.
    await expect(page.getByRole('link', { name: /phone|موبایل/i })).toHaveAttribute(
      'href',
      '/education',
    );
  });

  test('protected checkout redirects to education without session', async ({ page }) => {
    await page.goto('/checkout?product=ROADMAP_BUNDLE&roadmapId=rm-demo');
    await expect(page).toHaveURL(/\/education\?.*next=%2Fcheckout/);
  });

  test('assessment redirects unauthenticated users to education', async ({ page }) => {
    await page.goto('/assessment');
    await expect(page).toHaveURL(/\/education\?.*next=%2Fassessment/);
  });

  test('education phone step is reachable', async ({ page }) => {
    await page.goto('/education');
    await expect(page.getByRole('heading', { name: /Sign up with phone/i })).toBeVisible();
    await expect(page.getByLabel(/Mobile number/i)).toBeVisible();
  });
});

test.describe('Multilingual UI', () => {
  test('Persian enables RTL on landing', async ({ page }) => {
    await useLocale(page, 'fa');
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('link', { name: /مسیر یادگیری/i })).toBeVisible();
  });

  test('locale persists across reload for guests (cookie-driven)', async ({ page }) => {
    // Guests get the minimal landing without the site header — locale switching
    // is cookie-driven (`kia-academy-locale`), not via a header toggle.
    await useLocale(page, 'en');
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('link', { name: /Learning path/i })).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('landing CTAs remain usable at compact widths', async ({ page }) => {
    await useLocale(page, 'en');
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Learning path/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Material Studio/i }).first(),
    ).toBeVisible();
  });
});
