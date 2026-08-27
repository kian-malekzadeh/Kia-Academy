import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const prisma = {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    roadmap: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    entitlement: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    enrollment: {
      upsert: jest.fn(),
    },
    user: {
      findUniqueOrThrow: jest.fn(),
    },
    course: {
      findFirst: jest.fn(),
    },
  };

  const stripeService = {
    isConfigured: jest.fn().mockReturnValue(false),
    createSession: jest.fn(),
    constructWebhookEvent: jest.fn(),
  };

  const emailService = {
    sendPaymentReceipt: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  const siteSettings = {
    get: jest.fn().mockResolvedValue({
      general: { siteName: 'Kia Academy' },
      tracks: [],
      pricing: {
        readinessTestCents: 1900,
        courseCents: 490_000,
        modulePrices: [49, 69, 79, 89, 59],
        bundleDiscountPercent: 20,
      },
      payment: {
        enabled: true,
        provider: 'dev',
        currency: 'irr',
        merchantId: '',
        apiKey: '',
        sandbox: true,
        displayName: '',
        description: '',
        callbackUrl: '',
        successUrl: '',
        failureUrl: '',
      },
    }),
  };

  const createPaymentMock = jest.fn().mockResolvedValue({
    redirectUrl: null,
    gatewayRef: null,
    immediateConfirm: true,
  });
  const verifyPaymentMock = jest.fn().mockResolvedValue({ success: true, gatewayRef: 'ok' });

  const providers = {
    resolve: jest.fn().mockReturnValue({
      id: 'dev',
      createPayment: createPaymentMock,
      verifyPayment: verifyPaymentMock,
    }),
    resolveById: jest.fn().mockReturnValue({
      id: 'dev',
      createPayment: createPaymentMock,
      verifyPayment: verifyPaymentMock,
    }),
  };

  const cartService = {
    getCart: jest.fn(),
    clearCart: jest.fn().mockResolvedValue({ items: [] }),
  };

  const service = new PaymentsService(
    prisma as never,
    stripeService as never,
    emailService as never,
    configService as never,
    siteSettings as never,
    providers as never,
    cartService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.entitlement.findMany.mockResolvedValue([]);
    prisma.invoice.count.mockResolvedValue(0);
    prisma.invoice.findUnique.mockResolvedValue(null);
    createPaymentMock.mockResolvedValue({
      redirectUrl: null,
      gatewayRef: null,
      immediateConfirm: true,
    });
    verifyPaymentMock.mockResolvedValue({ success: true, gatewayRef: 'ok' });
    providers.resolve.mockReturnValue({
      id: 'dev',
      createPayment: createPaymentMock,
      verifyPayment: verifyPaymentMock,
    });
    providers.resolveById.mockReturnValue({
      id: 'dev',
      createPayment: createPaymentMock,
      verifyPayment: verifyPaymentMock,
    });
  });

  it('requires productRef for ROADMAP_BUNDLE checkout', async () => {
    await expect(
      service.createCheckout('user-1', { productType: 'ROADMAP_BUNDLE' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a pending payment using roadmap pricing', async () => {
    prisma.roadmap.findUnique.mockResolvedValue({
      id: 'rm-1',
      userId: 'user-1',
      trackName: 'Web',
      enrolled: false,
      pricing: JSON.stringify({ individual: [], total: 2490000, discounted: 1490000 }),
    });
    prisma.order.create.mockResolvedValue({
      id: 'ord-1',
      totalCents: 1490000,
      currency: 'irr',
    });
    prisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 1490000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
    });
    prisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 'pay-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 1490000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
      stripeId: null,
      metadata: null,
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.c',
      phone: null,
    });
    prisma.payment.update.mockResolvedValue({
      id: 'pay-1',
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
      amountCents: 1490000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
    });

    const result = await service.createCheckout('user-1', {
      productType: 'ROADMAP_BUNDLE',
      productRef: 'rm-1',
    });

    expect(prisma.order.create).toHaveBeenCalled();
    expect(prisma.payment.create).toHaveBeenCalled();
    expect(result.id).toBe('pay-1');
    expect(result.amountCents).toBe(1490000);
    expect(result.status).toBe('PENDING');
  });

  it('checkouts the cart into a multi-course order', async () => {
    cartService.getCart.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'ci-1',
          courseId: 'c1',
          courseSlug: 'js-basics',
          title: 'JS Basics',
          thumbnail: '📘',
          instructor: 'Web',
          trackKey: 'web',
          priceCents: 490_000,
          discountCents: 0,
          finalPriceCents: 490_000,
          addedAt: new Date().toISOString(),
        },
      ],
      itemCount: 1,
      subtotalCents: 490_000,
      discountCents: 0,
      totalCents: 490_000,
      currency: 'irr',
      updatedAt: new Date().toISOString(),
    });
    prisma.order.create.mockResolvedValue({
      id: 'ord-cart',
      totalCents: 490_000,
      currency: 'irr',
    });
    prisma.payment.create.mockResolvedValue({
      id: 'pay-cart',
      productType: 'COURSE',
      productRef: 'js-basics',
      amountCents: 490_000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-cart',
      provider: 'dev',
    });
    prisma.payment.findUniqueOrThrow.mockResolvedValue({
      id: 'pay-cart',
      productType: 'COURSE',
      productRef: 'js-basics',
      amountCents: 490_000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-cart',
      provider: 'dev',
      stripeId: null,
      metadata: null,
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.c',
      phone: null,
    });
    prisma.payment.update.mockResolvedValue({
      id: 'pay-cart',
      productType: 'COURSE',
      productRef: 'js-basics',
      amountCents: 490_000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-cart',
      provider: 'dev',
    });

    const result = await service.checkoutCart('user-1');
    expect(cartService.getCart).toHaveBeenCalledWith('user-1');
    expect(prisma.order.create).toHaveBeenCalled();
    expect(result.productType).toBe('COURSE');
    expect(result.amountCents).toBe(490_000);
  });

  it('rejects empty cart checkout', async () => {
    cartService.getCart.mockResolvedValue({
      id: 'cart-1',
      items: [],
      itemCount: 0,
      subtotalCents: 0,
      discountCents: 0,
      totalCents: 0,
      currency: 'irr',
      updatedAt: new Date().toISOString(),
    });
    await expect(service.checkoutCart('user-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('verifies gateway callback and completes payment', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      userId: 'user-1',
      productType: 'COURSE',
      productRef: 'js-basics',
      amountCents: 490_000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
      gatewayRef: 'auth-1',
      metadata: null,
      user: {
        id: 'user-1',
        name: 'Alex',
        firstName: 'Alex',
        lastName: null,
        email: 'a@b.c',
        phone: null,
      },
      order: {
        id: 'ord-1',
        source: 'CART',
        items: [],
      },
    });
    prisma.payment.update.mockResolvedValue({
      id: 'pay-1',
      productType: 'COURSE',
      productRef: 'js-basics',
      amountCents: 490_000,
      currency: 'irr',
      status: 'COMPLETED',
      orderId: 'ord-1',
      provider: 'dev',
    });
    prisma.order.update.mockResolvedValue({});
    prisma.order.findUniqueOrThrow.mockResolvedValue({
      id: 'ord-1',
      source: 'CART',
      subtotalCents: 490_000,
      discountCents: 0,
      totalCents: 490_000,
      currency: 'irr',
      items: [
        {
          id: 'oi-1',
          productType: 'COURSE',
          productRef: 'js-basics',
          title: 'JS',
          thumbnail: null,
          instructor: null,
          unitPriceCents: 490_000,
          discountCents: 0,
          finalPriceCents: 490_000,
          quantity: 1,
        },
      ],
    });
    prisma.course.findFirst.mockResolvedValue({
      id: 'c1',
      slug: 'js-basics',
    });

    const result = await service.handlePublicCallback({
      paymentId: 'pay-1',
      authority: 'auth-1',
      status: 'OK',
    });

    expect(result.success).toBe(true);
    expect(verifyPaymentMock).toHaveBeenCalled();
    expect(prisma.entitlement.upsert).toHaveBeenCalled();
    expect(prisma.enrollment.upsert).toHaveBeenCalled();
    expect(cartService.clearCart).toHaveBeenCalledWith('user-1');
    expect(prisma.invoice.create).toHaveBeenCalled();
  });

  it('marks payment failed when gateway verify fails', async () => {
    verifyPaymentMock.mockResolvedValue({
      success: false,
      failureReason: 'NOK',
      gatewayRef: 'auth-1',
    });
    prisma.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      userId: 'user-1',
      productType: 'COURSE',
      productRef: 'js-basics',
      amountCents: 490_000,
      currency: 'irr',
      status: 'PENDING',
      orderId: 'ord-1',
      provider: 'dev',
      gatewayRef: 'auth-1',
      metadata: null,
    });
    prisma.payment.update.mockResolvedValue({
      id: 'pay-1',
      status: 'FAILED',
      productType: 'COURSE',
      amountCents: 490_000,
      currency: 'irr',
    });

    const result = await service.handlePublicCallback({
      paymentId: 'pay-1',
      status: 'NOK',
    });

    expect(result.success).toBe(false);
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'FAILED' },
      }),
    );
  });

  it('rejects checkout when payments are disabled', async () => {
    siteSettings.get.mockResolvedValue({
      general: { siteName: 'Kia' },
      tracks: [],
      pricing: {
        readinessTestCents: 0,
        courseCents: 1000,
        modulePrices: [1],
        bundleDiscountPercent: 0,
      },
      payment: {
        enabled: false,
        provider: 'dev',
        currency: 'irr',
        merchantId: '',
        apiKey: '',
        sandbox: true,
        displayName: '',
        description: '',
        callbackUrl: '',
        successUrl: '',
        failureUrl: '',
      },
    });
    cartService.getCart.mockResolvedValue({
      id: 'cart-1',
      items: [
        {
          id: 'ci-1',
          courseId: 'c1',
          courseSlug: 'js',
          title: 'JS',
          thumbnail: '📘',
          instructor: 'Web',
          trackKey: 'web',
          priceCents: 1000,
          discountCents: 0,
          finalPriceCents: 1000,
          addedAt: new Date().toISOString(),
        },
      ],
      itemCount: 1,
      subtotalCents: 1000,
      discountCents: 0,
      totalCents: 1000,
      currency: 'irr',
      updatedAt: new Date().toISOString(),
    });
    await expect(service.checkoutCart('user-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
