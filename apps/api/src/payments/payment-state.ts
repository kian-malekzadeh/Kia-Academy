import { BadRequestException } from '@nestjs/common';

/**
 * Single source of truth for the payment lifecycle. The ONLY way a payment may
 * change state is along one of these edges, enforced both here (service layer)
 * and with atomic conditional UPDATE claims (DB layer).
 *
 * Terminal states (FAILED/CANCELLED/REFUNDED) may never reach PAID/COMPLETED
 * directly. A failed/cancelled attempt may only be re-tried by resetting to
 * PENDING, which starts a brand-new payment attempt (never a silent backdoor).
 */
export const PAYMENT_TRANSITIONS = {
  PENDING: ['PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  FAILED: ['PENDING'], // explicit retry only
  CANCELLED: ['PENDING'], // explicit retry only
  REFUNDED: [],
  PARTIALLY_REFUNDED: [],
} as const;

export type PaymentStatusKey = keyof typeof PAYMENT_TRANSITIONS;

/**
 * Throws unless `from → to` is a valid edge of the payment state machine.
 * Passing the same state is an idempotent no-op (already observed).
 */
export function assertValidPaymentTransition(
  from: PaymentStatusKey,
  to: PaymentStatusKey,
  context?: string,
): void {
  if (from === to) {
    return;
  }
  const allowed = PAYMENT_TRANSITIONS[from] as readonly string[] | undefined;
  if (allowed && allowed.includes(to)) {
    return;
  }
  throw new BadRequestException(
    `Invalid payment state transition: ${from} → ${to}${context ? ` (${context})` : ''}`,
  );
}

/** States from which a payment may be atomically claimed as completed (DB guard). */
export const COMPLETABLE_PAYMENT_STATES = ['PENDING', 'PROCESSING'] as const;