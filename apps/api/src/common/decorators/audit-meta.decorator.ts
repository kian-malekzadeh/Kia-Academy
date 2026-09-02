import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Request metadata captured for the admin audit trail. */
export interface AuditRequestMeta {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/**
 * Extracts client IP, User-Agent, and the `x-request-id` header (when present)
 * from the incoming request so every admin mutation can be attributed in the
 * immutable audit trail.
 */
export const AuditMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuditRequestMeta => {
    const request = ctx.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const rawRequestId = request.headers['x-request-id'];
    const requestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;
    const rawUserAgent = request.headers['user-agent'];
    const userAgent = Array.isArray(rawUserAgent) ? rawUserAgent.join(', ') : rawUserAgent;
    return {
      ip: request.ip ?? null,
      userAgent: userAgent ?? null,
      requestId: requestId ?? null,
    };
  },
);
