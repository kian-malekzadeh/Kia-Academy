-- Wallet financial integrity: link WalletTransaction → Payment via FK + unique,
-- and enforce non-negative wallet balances at the DB layer.

-- 1. Add a unique index on paymentId (one wallet ledger entry per completed payment).
--    Backfill: skip rows with NULL paymentId (manual admin adjustments).
CREATE UNIQUE INDEX "WalletTransaction_paymentId_key"
  ON "WalletTransaction"("paymentId")
  WHERE "paymentId" IS NOT NULL;

-- 2. Foreign key: wallet transactions may reference a payment (ON DELETE SET NULL
--    so refunds/removal of a payment row don't orphan the audit trail).
ALTER TABLE "WalletTransaction"
  ADD CONSTRAINT "WalletTransaction_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Invariant: a wallet balance must never go negative.
ALTER TABLE "LearnerWallet"
  ADD CONSTRAINT "LearnerWallet_balanceCents_nonnegative"
  CHECK ("balanceCents" >= 0);
