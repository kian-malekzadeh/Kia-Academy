import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  hasCourseEntitlement,
  normalizePaymentSettings,
  entitlementKey,
  toDisplayUnits,
  normalizePaymentCurrency,
  type CheckoutDto,
  type GatewayVerifyDto,
  type GatewayVerifyResponse,
  type InvoiceResponse,
  type OrderItemResponse,
  type OrderResponse,
  type OrderStatus,
  type PaymentResponse,
  type SitePaymentSettings,
  type RoadmapResponse,
  type WalletSummary,
  type WalletTransactionDto,
} from '@kia-academy/shared';
import type Stripe from 'stripe';
import { isProductionEnv } from '../common/utils/node-env';
import { CartService } from '../cart/cart.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { StripeService } from '../stripe/stripe.service';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';

type LineDraft = {
  productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
  productRef: string;
  title: string;
  thumbnail?: string | null;
  instructor?: string | null;
  unitPriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  quantity: number;
  courseId?: string | null;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly siteSettings: SiteSettingsService,
    private readonly providers: PaymentProviderRegistry,
    private readonly cartService: CartService,
  ) {}

  async createCheckout(userId: string, dto: CheckoutDto): Promise<PaymentResponse> {
    if (dto.fromCart) {
      return this.checkoutCart(userId);
    }
    if (!dto.productType) {
      throw new BadRequestException('productType is required');
    }
    const lines = await this.resolveDirectLines(userId, { ...dto, productType: dto.productType });
    return this.createOrderAndPay(userId, lines, 'DIRECT');
  }

  async checkoutCart(userId: string): Promise<PaymentResponse> {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }
    const lines: LineDraft[] = cart.items.map((item) => ({
      productType: 'COURSE',
      productRef: item.courseSlug,
      title: item.title,
      thumbnail: item.thumbnail,
      instructor: item.instructor,
      unitPriceCents: item.priceCents,
      discountCents: item.discountCents,
      finalPriceCents: item.finalPriceCents,
      quantity: 1,
      courseId: item.courseId,
    }));
    return this.createOrderAndPay(userId, lines, 'CART');
  }

  async retryPayment(userId: string, orderId: string): Promise<PaymentResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.status === 'PAID') {
      throw new BadRequestException('Order is already paid');
    }
    if (order.payment?.status === 'COMPLETED') {
      throw new BadRequestException('Payment already completed');
    }

    const lines: LineDraft[] = order.items.map((item) => ({
      productType: item.productType,
      productRef: item.productRef,
      title: item.title,
      thumbnail: item.thumbnail,
      instructor: item.instructor,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents,
      finalPriceCents: item.finalPriceCents,
      quantity: item.quantity,
      courseId: item.courseId,
    }));

    const paymentCfg = await this.resolvePaymentConfig();
    this.assertPaymentsEnabled(paymentCfg);

    const productType = lines.length === 1 ? lines[0].productType : 'COURSE';
    const productRef =
      lines.length === 1
        ? lines[0].productRef
        : JSON.stringify(lines.filter((l) => l.productType === 'COURSE').map((l) => l.productRef));

    let paymentId: string;
    if (order.payment) {
      const refreshed = await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: 'PENDING',
          provider: paymentCfg.provider,
          gatewayRef: null,
          stripeId: null,
          metadata: null,
          amountCents: order.totalCents,
          currency: order.currency,
          productType,
          productRef,
        },
      });
      paymentId = refreshed.id;
    } else {
      const created = await this.prisma.payment.create({
        data: {
          userId,
          orderId: order.id,
          productType,
          productRef,
          amountCents: order.totalCents,
          currency: order.currency,
          status: 'PENDING',
          provider: paymentCfg.provider,
        },
      });
      paymentId = created.id;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'AWAITING_PAYMENT' },
    });

    return this.startProviderCheckout(userId, paymentId, order.id, lines, paymentCfg);
  }

  async confirmPayment(userId: string, paymentId: string): Promise<PaymentResponse> {
    // Free / in-app confirmation must never run in production — use gateway verify.
    if (isProductionEnv()) {
      throw new BadRequestException(
        'Manual payment confirmation is disabled in production. Complete payment via the gateway callback.',
      );
    }

    const paymentCfg = await this.resolvePaymentConfig();
    if (paymentCfg.provider === 'stripe' && this.stripeService.isConfigured()) {
      const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      if (payment?.stripeId && !paymentCfg.sandbox && payment.provider === 'stripe') {
        throw new BadRequestException(
          'Payment confirmation via API is only available in development without Stripe',
        );
      }
    }

    const existing = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    // Live ZarinPal (merchant configured, not a simulator ref) must use callback verify.
    if (
      paymentCfg.provider === 'zarinpal' &&
      paymentCfg.merchantId &&
      existing?.gatewayRef &&
      !existing.gatewayRef.startsWith('zarinpal-sim-')
    ) {
      throw new BadRequestException(
        'ZarinPal payments must be confirmed via the gateway callback verify endpoint',
      );
    }

    return this.completePayment(userId, paymentId, { skipOwnershipCheck: false });
  }

  async verifyGatewayCallback(
    userId: string | null,
    dto: GatewayVerifyDto,
  ): Promise<GatewayVerifyResponse> {
    const paymentCfg = await this.resolvePaymentConfig();
    const payment = await this.findPaymentForVerify(dto);
    if (!payment) {
      throw new NotFoundException('Payment not found for gateway callback');
    }
    if (userId && payment.userId !== userId) {
      throw new NotFoundException('Payment not found for gateway callback');
    }

    const successUrl = this.resolveUrl(
      paymentCfg.successUrl,
      `/checkout/success?payment_id=${payment.id}`,
    );
    const failureUrl = this.resolveUrl(
      paymentCfg.failureUrl,
      `/checkout/cancel?payment_id=${payment.id}`,
    );

    if (payment.status === 'COMPLETED') {
      return {
        success: true,
        payment: this.toResponse(payment),
        redirectUrl: successUrl,
      };
    }

    const provider = this.providers.resolveById(
      (payment.provider as SitePaymentSettings['provider']) || paymentCfg.provider,
    );
    const verify = await provider.verifyPayment(
      {
        paymentId: payment.id,
        amountIrr: payment.amountCents,
        gatewayRef: payment.gatewayRef,
        authority: dto.authority,
        status: dto.status,
        metadata: payment.metadata,
      },
      paymentCfg,
    );

    if (!verify.success) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayRef: verify.gatewayRef ?? payment.gatewayRef,
          metadata: JSON.stringify({
            ...(safeParse(payment.metadata) ?? {}),
            verifyFailure: verify.failureReason,
          }),
        },
      });
      if (payment.orderId) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'FAILED' },
        });
      }
      return {
        success: false,
        payment: this.toResponse({ ...payment, status: 'FAILED' }),
        redirectUrl: failureUrl,
      };
    }

    const completed = await this.completePayment(payment.userId, payment.id, {
      skipOwnershipCheck: true,
      gatewayRef: verify.gatewayRef ?? dto.authority ?? payment.gatewayRef,
    });

    return { success: true, payment: completed, redirectUrl: successUrl };
  }

  /** Public callback used by ZarinPal redirect (may be unauthenticated). */
  async handlePublicCallback(dto: GatewayVerifyDto): Promise<GatewayVerifyResponse> {
    return this.verifyGatewayCallback(null, dto);
  }

  async getPaymentForUser(userId: string, paymentId: string): Promise<PaymentResponse> {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.userId !== userId) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    return this.toResponse(payment);
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string | string[] | undefined,
  ): Promise<{ received: true }> {
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const event = this.stripeService.constructWebhookEvent(rawBody, signature);

    if (event.type === 'checkout.session.completed') {
      await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }

    return { received: true };
  }

  async getMyPayments(userId: string): Promise<PaymentResponse[]> {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((payment) => this.toResponse(payment));
  }

  /** Ensure a wallet row exists (lazy create for existing learners). */
  async ensureWallet(userId: string) {
    const existing = await this.prisma.learnerWallet.findUnique({ where: { userId } });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    const digits = (user?.phone ?? userId).replace(/\D/g, '');
    const cardLast4 = (digits.slice(-4) || '1234').padStart(4, '0').slice(-4);

    return this.prisma.learnerWallet.create({
      data: {
        userId,
        balanceCents: 0,
        cardLast4,
        expiresLabel: '06/27',
      },
    });
  }

  async getWalletSummary(userId: string, limit = 5): Promise<WalletSummary> {
    const wallet = await this.ensureWallet(userId);
    const take = Math.min(Math.max(limit, 1), 50);

    const [ledger, payments] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.payment.findMany({
        where: {
          userId,
          status: { in: ['COMPLETED', 'REFUNDED'] },
        },
        orderBy: { createdAt: 'desc' },
        take,
      }),
    ]);

    const fromLedger: WalletTransactionDto[] = ledger.map((row) => ({
      id: row.id,
      description: row.description,
      amountCents: row.type === 'CREDIT' ? row.amountCents : -row.amountCents,
      type: row.type === 'CREDIT' ? 'credit' : 'debit',
      createdAt: row.createdAt.toISOString(),
      paymentId: row.paymentId,
    }));

    const ledgerPaymentIds = new Set(
      ledger.map((row) => row.paymentId).filter((id): id is string => Boolean(id)),
    );

    const fromPayments: WalletTransactionDto[] = payments
      .filter((payment) => !ledgerPaymentIds.has(payment.id))
      .map((payment) => {
        const isRefund = payment.status === 'REFUNDED';
        return {
          id: `pay-${payment.id}`,
          description: this.paymentDescription(payment.productType, payment.productRef),
          amountCents: isRefund ? payment.amountCents : -payment.amountCents,
          type: isRefund ? ('credit' as const) : ('debit' as const),
          createdAt: payment.createdAt.toISOString(),
          paymentId: payment.id,
        };
      });

    const merged = [...fromLedger, ...fromPayments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, take);

    return {
      balanceCents: wallet.balanceCents,
      currency: wallet.currency,
      cardLast4: wallet.cardLast4,
      expiresLabel: wallet.expiresLabel,
      transactions: merged,
    };
  }

  async getWalletTransactions(userId: string, limit = 5): Promise<WalletTransactionDto[]> {
    const summary = await this.getWalletSummary(userId, limit);
    return summary.transactions;
  }

  private paymentDescription(
    productType: PaymentResponse['productType'],
    productRef?: string | null,
  ): string {
    switch (productType) {
      case 'ROADMAP_BUNDLE':
        return 'خرید بسته نقشه راه';
      case 'READINESS_TEST':
        return 'پرداخت آزمون آمادگی';
      case 'COURSE':
        return productRef ? `خرید دوره ${productRef}` : 'خرید دوره';
      default:
        return 'تراکنش پرداخت';
    }
  }

  async getMyOrders(userId: string): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true, payment: true, invoice: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toOrderResponse(o));
  }

  async getOrderForUser(userId: string, orderId: string): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true, invoice: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return this.toOrderResponse(order);
  }

  async getInvoiceForUser(userId: string, orderId: string): Promise<InvoiceResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true, items: true },
    });
    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (!order.invoice) {
      throw new NotFoundException(`Invoice for order ${orderId} not found`);
    }
    return this.toInvoiceResponse(order.invoice, order.items);
  }

  async renderInvoiceHtml(userId: string, orderId: string): Promise<string> {
    const invoice = await this.getInvoiceForUser(userId, orderId);
    const settings = await this.siteSettings.get();
    const siteName = settings.general.siteName || 'Kia Academy';
    const currency = normalizePaymentCurrency(invoice.currency || settings.payment?.currency);
    const label = currency === 'irt' ? 'IRT' : 'IRR';
    const fmt = (amount: number) => `${toDisplayUnits(amount, currency)} ${label}`;
    const rows = invoice.lineItems
      .map(
        (line) =>
          `<tr><td>${escapeHtml(line.title)}</td><td>${line.quantity}</td><td>${fmt(line.finalPriceCents)}</td></tr>`,
      )
      .join('');
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNumber)} — ${escapeHtml(siteName)}</title>
  <style>
    body { font-family: Tahoma, sans-serif; padding: 2rem; color: #111; }
    h1 { font-size: 1.25rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: right; }
    th { background: #f5f5f5; }
    .meta { margin: 0.25rem 0; color: #444; font-size: 0.9rem; }
    .total { font-weight: bold; font-size: 1.1rem; margin-top: 1rem; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Print / Save PDF</button>
  <h1>${escapeHtml(siteName)} — Invoice</h1>
  <p class="meta">Invoice #: ${escapeHtml(invoice.invoiceNumber)}</p>
  <p class="meta">Date: ${escapeHtml(invoice.issuedAt)}</p>
  <p class="meta">Buyer: ${escapeHtml(invoice.buyerName)}</p>
  ${invoice.buyerEmail ? `<p class="meta">Email: ${escapeHtml(invoice.buyerEmail)}</p>` : ''}
  ${invoice.buyerPhone ? `<p class="meta">Phone: ${escapeHtml(invoice.buyerPhone)}</p>` : ''}
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Amount (${label})</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">Total: ${fmt(invoice.totalCents)}</p>
</body>
</html>`;
  }

  // --- internals -----------------------------------------------------------

  private async createOrderAndPay(
    userId: string,
    lines: LineDraft[],
    source: 'CART' | 'DIRECT',
  ): Promise<PaymentResponse> {
    const paymentCfg = await this.resolvePaymentConfig();
    this.assertPaymentsEnabled(paymentCfg);

    if (!lines.length) {
      throw new BadRequestException('Nothing to checkout');
    }

    await this.assertNotAlreadyOwned(userId, lines);

    const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
    const discountCents = lines.reduce((s, l) => s + l.discountCents, 0);
    const totalCents = lines.reduce((s, l) => s + l.finalPriceCents, 0);
    const currency = paymentCfg.currency;

    const productType = lines.length === 1 ? lines[0].productType : 'COURSE';
    const productRef =
      lines.length === 1
        ? lines[0].productRef
        : JSON.stringify(
            lines.filter((l) => l.productType === 'COURSE').map((l) => l.productRef),
          );

    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'AWAITING_PAYMENT',
        subtotalCents,
        discountCents,
        totalCents,
        currency,
        source,
        items: {
          create: lines.map((l) => ({
            productType: l.productType,
            productRef: l.productRef,
            title: l.title,
            thumbnail: l.thumbnail ?? null,
            instructor: l.instructor ?? null,
            unitPriceCents: l.unitPriceCents,
            discountCents: l.discountCents,
            finalPriceCents: l.finalPriceCents,
            quantity: l.quantity,
            courseId: l.courseId ?? null,
          })),
        },
      },
    });

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        orderId: order.id,
        productType,
        productRef,
        amountCents: totalCents,
        currency,
        status: 'PENDING',
        provider: paymentCfg.provider,
      },
    });

    return this.startProviderCheckout(userId, payment.id, order.id, lines, paymentCfg);
  }

  private async startProviderCheckout(
    userId: string,
    paymentId: string,
    orderId: string,
    lines: LineDraft[],
    paymentCfg: SitePaymentSettings,
  ): Promise<PaymentResponse> {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const provider = this.providers.resolve(paymentCfg);

    const callbackUrl = this.resolveUrl(
      paymentCfg.callbackUrl,
      `/api/payments/callback?payment_id=${payment.id}`,
    );
    const successUrl = this.resolveUrl(
      paymentCfg.successUrl,
      `/checkout/success?payment_id=${payment.id}`,
    );
    const cancelUrl = this.resolveUrl(
      paymentCfg.failureUrl,
      `/checkout/cancel?payment_id=${payment.id}`,
    );

    const description =
      paymentCfg.description?.trim() ||
      (lines.length === 1 ? lines[0].title : `${lines.length} courses — Kia Academy`);

    const result = await provider.createPayment(
      {
        paymentId: payment.id,
        amountIrr: payment.amountCents,
        description,
        customerEmail: user.email,
        customerPhone: user.phone,
        callbackUrl,
        successUrl,
        cancelUrl,
        metadata: { orderId },
      },
      paymentCfg,
    );

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayRef: result.gatewayRef,
        stripeId:
          paymentCfg.provider === 'stripe' && result.gatewayRef?.startsWith('cs_')
            ? result.gatewayRef
            : payment.stripeId,
        metadata: result.metadata ? JSON.stringify(result.metadata) : payment.metadata,
        provider: paymentCfg.provider,
      },
    });

    if (result.immediateConfirm) {
      // Dev provider — caller will confirm; return without checkoutUrl.
      return this.toResponse(updated);
    }

    return this.toResponse(updated, result.redirectUrl ?? undefined);
  }

  private async completePayment(
    userId: string,
    paymentId: string,
    opts: {
      skipOwnershipCheck: boolean;
      gatewayRef?: string | null;
    },
  ): Promise<PaymentResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true, order: { include: { items: true } } },
    });

    if (!payment || (!opts.skipOwnershipCheck && payment.userId !== userId)) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status === 'COMPLETED') {
      return this.toResponse(payment);
    }

    const completed = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        gatewayRef: opts.gatewayRef ?? payment.gatewayRef,
      },
    });

    await this.grantEntitlements(completed);

    if (payment.orderId) {
      const invoiceNumber = await this.nextInvoiceNumber();
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID', invoiceNumber },
      });

      const order = await this.prisma.order.findUniqueOrThrow({
        where: { id: payment.orderId },
        include: { items: true },
      });

      const existingInvoice = await this.prisma.invoice.findUnique({
        where: { orderId: order.id },
      });
      if (!existingInvoice) {
        await this.prisma.invoice.create({
          data: {
            orderId: order.id,
            invoiceNumber,
            buyerName: payment.user.name || [payment.user.firstName, payment.user.lastName]
              .filter(Boolean)
              .join(' ') || 'Learner',
            buyerEmail: payment.user.email,
            buyerPhone: payment.user.phone,
            currency: order.currency,
            subtotalCents: order.subtotalCents,
            discountCents: order.discountCents,
            totalCents: order.totalCents,
            lineItems: JSON.stringify(
              order.items.map((item) => this.toOrderItemResponse(item)),
            ),
          },
        });
      }

      if (order.source === 'CART') {
        await this.cartService.clearCart(payment.userId);
      }
    }

    await this.emailService.sendPaymentReceipt(
      {
        id: payment.user.id,
        name: payment.user.name,
        email: payment.user.email ?? 'noreply@kia.academy',
      },
      completed,
    );

    return this.toResponse(completed);
  }

  private async resolveDirectLines(userId: string, dto: CheckoutDto): Promise<LineDraft[]> {
    const settings = await this.siteSettings.get();
    const siteName = settings.general.siteName || 'کیا آکادمی';
    const trackMap = new Map(settings.tracks.map((t) => [t.key, t.name]));

    if (dto.productType === 'READINESS_TEST') {
      throw new BadRequestException('Readiness test is free and no longer sold separately');
    }

    if (dto.productType === 'COURSE') {
      const slugs = dto.courseSlugs?.length
        ? [...new Set(dto.courseSlugs.map((s) => s.trim()).filter(Boolean))]
        : dto.productRef
          ? this.parseCourseRefs(dto.productRef)
          : [];
      if (!slugs.length) {
        throw new BadRequestException('productRef or courseSlugs is required for COURSE checkout');
      }

      const lines: LineDraft[] = [];
      for (const slug of slugs) {
        const course = await this.prisma.course.findFirst({
          where: { OR: [{ slug }, { id: slug }], published: true },
        });
        if (!course) throw new NotFoundException(`Course ${slug} not found`);
        const unit = settings.pricing.courseCents;
        lines.push({
          productType: 'COURSE',
          productRef: course.slug,
          title: course.title,
          thumbnail: course.icon || '📘',
          instructor: (course.trackKey && trackMap.get(course.trackKey)) || siteName,
          unitPriceCents: unit,
          discountCents: 0,
          finalPriceCents: unit,
          quantity: 1,
          courseId: course.id,
        });
      }
      return lines;
    }

    if (dto.productType === 'ROADMAP_BUNDLE') {
      if (!dto.productRef) {
        throw new BadRequestException(
          'productRef (roadmap id) is required for ROADMAP_BUNDLE checkout',
        );
      }
      const roadmap = await this.prisma.roadmap.findUnique({ where: { id: dto.productRef } });
      if (!roadmap || roadmap.userId !== userId) {
        throw new NotFoundException(`Roadmap ${dto.productRef} not found`);
      }
      const pricing = JSON.parse(roadmap.pricing) as RoadmapResponse['pricing'];
      return [
        {
          productType: 'ROADMAP_BUNDLE',
          productRef: roadmap.id,
          title: `${roadmap.trackName} roadmap bundle`,
          thumbnail: '🗺️',
          instructor: siteName,
          unitPriceCents: pricing.total,
          discountCents: Math.max(0, pricing.total - pricing.discounted),
          finalPriceCents: pricing.discounted,
          quantity: 1,
        },
      ];
    }

    throw new BadRequestException(`Unsupported product type: ${dto.productType}`);
  }

  private async assertNotAlreadyOwned(userId: string, lines: LineDraft[]): Promise<void> {
    const entitlements = await this.prisma.entitlement.findMany({ where: { userId } });
    const entitlementKeys = entitlements.map((e) => entitlementKey(e.resourceType, e.resourceId));
    for (const line of lines) {
      if (line.productType === 'COURSE' && hasCourseEntitlement(entitlementKeys, line.productRef)) {
        throw new BadRequestException(`Course already purchased: ${line.productRef}`);
      }
      if (line.productType === 'ROADMAP_BUNDLE') {
        const roadmap = await this.prisma.roadmap.findUnique({ where: { id: line.productRef } });
        if (roadmap?.enrolled) {
          throw new BadRequestException('Roadmap bundle already purchased');
        }
      }
    }
  }

  private async findPaymentForVerify(dto: GatewayVerifyDto) {
    if (dto.paymentId) {
      return this.prisma.payment.findUnique({ where: { id: dto.paymentId } });
    }
    if (dto.authority) {
      return this.prisma.payment.findFirst({
        where: { gatewayRef: dto.authority },
        orderBy: { createdAt: 'desc' },
      });
    }
    return null;
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) return;

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status === 'COMPLETED') return;

    await this.completePayment(payment.userId, payment.id, {
      skipOwnershipCheck: true,
      gatewayRef: session.id,
    });
  }

  private async resolvePaymentConfig(): Promise<SitePaymentSettings> {
    const settings = await this.siteSettings.get();
    return normalizePaymentSettings(settings.payment);
  }

  private assertPaymentsEnabled(cfg: SitePaymentSettings): void {
    if (!cfg.enabled) {
      throw new BadRequestException('Payments are currently disabled');
    }
  }

  private resolveUrl(configured: string, fallbackPath: string): string {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const value = (configured || '').trim();
    if (!value) return `${appUrl.replace(/\/$/, '')}${fallbackPath.startsWith('/') ? '' : '/'}${fallbackPath}`;
    if (/^https?:\/\//i.test(value)) {
      // If absolute URL already includes query, append payment context on caller side.
      return value;
    }
    return `${appUrl.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;
  }

  private parseCourseRefs(productRef: string | null): string[] {
    if (!productRef) return [];
    try {
      const parsed = JSON.parse(productRef) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
      }
    } catch {
      /* single slug */
    }
    return [productRef];
  }

  private async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    });
    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async grantEntitlements(payment: {
    id: string;
    userId: string;
    productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
    productRef: string | null;
  }): Promise<void> {
    switch (payment.productType) {
      case 'READINESS_TEST':
        await this.prisma.entitlement.upsert({
          where: {
            userId_resourceType_resourceId: {
              userId: payment.userId,
              resourceType: 'readiness',
              resourceId: 'test',
            },
          },
          create: {
            userId: payment.userId,
            resourceType: 'readiness',
            resourceId: 'test',
            source: 'PURCHASE',
          },
          update: { source: 'PURCHASE' },
        });
        break;

      case 'ROADMAP_BUNDLE':
        if (!payment.productRef) {
          throw new BadRequestException('Roadmap reference missing on payment');
        }
        await this.prisma.entitlement.upsert({
          where: {
            userId_resourceType_resourceId: {
              userId: payment.userId,
              resourceType: 'roadmap',
              resourceId: payment.productRef,
            },
          },
          create: {
            userId: payment.userId,
            resourceType: 'roadmap',
            resourceId: payment.productRef,
            source: 'BUNDLE',
          },
          update: { source: 'BUNDLE' },
        });
        await this.prisma.roadmap.update({
          where: { id: payment.productRef },
          data: { enrolled: true, paymentId: payment.id },
        });
        break;

      case 'COURSE':
        for (const slug of this.parseCourseRefs(payment.productRef)) {
          const course = await this.prisma.course.findFirst({
            where: { OR: [{ slug }, { id: slug }] },
          });
          const courseSlug = course?.slug ?? slug;
          await this.prisma.entitlement.upsert({
            where: {
              userId_resourceType_resourceId: {
                userId: payment.userId,
                resourceType: 'course',
                resourceId: courseSlug,
              },
            },
            create: {
              userId: payment.userId,
              resourceType: 'course',
              resourceId: courseSlug,
              source: 'PURCHASE',
            },
            update: { source: 'PURCHASE' },
          });
          if (course) {
            await this.prisma.enrollment.upsert({
              where: { userId_courseId: { userId: payment.userId, courseId: course.id } },
              create: { userId: payment.userId, courseId: course.id },
              update: {},
            });
          }
        }
        break;
    }
  }

  private toResponse(
    payment: {
      id: string;
      productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
      productRef?: string | null;
      amountCents: number;
      currency: string;
      status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
      orderId?: string | null;
      provider?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    checkoutUrl?: string,
  ): PaymentResponse {
    return {
      id: payment.id,
      productType: payment.productType,
      productRef: payment.productRef ?? null,
      amountCents: payment.amountCents,
      currency: payment.currency,
      status: payment.status,
      checkoutUrl,
      orderId: payment.orderId ?? null,
      provider: payment.provider ?? null,
      createdAt: payment.createdAt?.toISOString(),
      updatedAt: payment.updatedAt?.toISOString(),
    };
  }

  private toOrderItemResponse(item: {
    id: string;
    productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
    productRef: string;
    title: string;
    thumbnail?: string | null;
    instructor?: string | null;
    unitPriceCents: number;
    discountCents: number;
    finalPriceCents: number;
    quantity: number;
  }): OrderItemResponse {
    return {
      id: item.id,
      productType: item.productType,
      productRef: item.productRef,
      title: item.title,
      thumbnail: item.thumbnail,
      instructor: item.instructor,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents,
      finalPriceCents: item.finalPriceCents,
      quantity: item.quantity,
    };
  }

  private toInvoiceResponse(
    invoice: {
      id: string;
      orderId: string;
      invoiceNumber: string;
      issuedAt: Date;
      buyerName: string;
      buyerEmail: string | null;
      buyerPhone: string | null;
      currency: string;
      subtotalCents: number;
      discountCents: number;
      totalCents: number;
      lineItems: string;
    },
    fallbackItems: Array<{
      id: string;
      productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
      productRef: string;
      title: string;
      thumbnail?: string | null;
      instructor?: string | null;
      unitPriceCents: number;
      discountCents: number;
      finalPriceCents: number;
      quantity: number;
    }>,
  ): InvoiceResponse {
    let lineItems: OrderItemResponse[] = fallbackItems.map((i) => this.toOrderItemResponse(i));
    try {
      const parsed = JSON.parse(invoice.lineItems) as OrderItemResponse[];
      if (Array.isArray(parsed) && parsed.length) lineItems = parsed;
    } catch {
      /* use fallback */
    }
    return {
      id: invoice.id,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt.toISOString(),
      buyerName: invoice.buyerName,
      buyerEmail: invoice.buyerEmail,
      buyerPhone: invoice.buyerPhone,
      currency: invoice.currency,
      subtotalCents: invoice.subtotalCents,
      discountCents: invoice.discountCents,
      totalCents: invoice.totalCents,
      lineItems,
      downloadPath: `/api/payments/orders/${invoice.orderId}/invoice.html`,
    };
  }

  private toOrderResponse(order: {
    id: string;
    status: OrderStatus;
    invoiceNumber: string | null;
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productType: 'READINESS_TEST' | 'ROADMAP_BUNDLE' | 'COURSE';
      productRef: string;
      title: string;
      thumbnail?: string | null;
      instructor?: string | null;
      unitPriceCents: number;
      discountCents: number;
      finalPriceCents: number;
      quantity: number;
    }>;
    payment?: {
      id: string;
      status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    } | null;
    invoice?: {
      id: string;
      orderId: string;
      invoiceNumber: string;
      issuedAt: Date;
      buyerName: string;
      buyerEmail: string | null;
      buyerPhone: string | null;
      currency: string;
      subtotalCents: number;
      discountCents: number;
      totalCents: number;
      lineItems: string;
    } | null;
  }): OrderResponse {
    return {
      id: order.id,
      status: order.status,
      invoiceNumber: order.invoiceNumber,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      currency: order.currency,
      items: order.items.map((i) => this.toOrderItemResponse(i)),
      paymentId: order.payment?.id ?? null,
      paymentStatus: order.payment?.status ?? null,
      invoice: order.invoice ? this.toInvoiceResponse(order.invoice, order.items) : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}

function safeParse(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
