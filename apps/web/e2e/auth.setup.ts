import { test as setup } from '@playwright/test';

// Optional auth setup — extend when E2E tests need authenticated sessions.
setup('auth placeholder', async () => {
  // No-op: learner journey tests run unauthenticated.
});
