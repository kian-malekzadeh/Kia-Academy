import {
  Global,
  Injectable,
  Logger,
  Module,
  type OnApplicationShutdown,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import Redis from 'ioredis';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ConfigService } from '@nestjs/config';

/**
 * CI-2 — distributed rate limiting.
 *
 * The @nestjs/throttler default storage is a per-process `Map`, which is fine
 * for a single instance but lets attackers multiply their budget across
 * replicas. When `REDIS_URL` is configured, this module registers the
 * Redis-backed storage so every API replica shares one counter store; when it
 * is absent (local dev, CI, single-node deployments), the stock in-memory
 * service is used instead.
 *
 * Availability policy: Redis outages must NOT take the API down. The wrapper
 * fails open — on a Redis error it falls back to the in-memory service for
 * that request and logs the failure (monitor logs; they indicate Redis
 * connectivity problems). Fail-open is the deliberate trade-off: rate limits
 * are abuse mitigation, not a correctness guarantee.
 */
@Injectable()
export class RateLimitStorageProvider implements OnModuleDestroy, OnApplicationShutdown {
  private readonly logger = new Logger(RateLimitStorageProvider.name);
  private readonly redis: ThrottlerStorageRedisService | null;
  private readonly memory = new ThrottlerStorageService();

  constructor(configService: ConfigService) {
    const url = configService.get<string>('REDIS_URL');
    if (url) {
      try {
        this.redis = new ThrottlerStorageRedisService(
          new Redis(url, {
            // Rate limiting must never block app boot on a slow Redis.
            lazyConnect: false,
            maxRetriesPerRequest: 2,
            connectTimeout: 5_000,
            enableOfflineQueue: false,
          }),
        );
        this.logger.log('Distributed rate limiting enabled (Redis storage)');
        this.redis.redis.on('error', (err: Error) => {
          this.logger.error(`Redis rate-limit store error: ${err.message}`);
        });
      } catch (err) {
        this.redis = null;
        this.logger.error(
          `Failed to initialize Redis rate-limit storage; using in-memory storage`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    } else {
      this.logger.warn(
        'REDIS_URL not set — using in-memory rate limiting (single-instance only)',
      );
    }
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    if (this.redis) {
      try {
        return await this.redis.increment(key, ttl, limit, blockDuration, throttlerName);
      } catch (err) {
        this.logger.error(
          `Redis increment failed — failing open to in-memory storage`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }
    return this.memory.increment(key, ttl, limit, blockDuration, throttlerName);
  }

  onModuleDestroy(): void {
    // ThrottlerStorageRedisService owns its connection only when it created it
    // from a URL; it disconnects itself via its own OnModuleDestroy hook when
    // registered directly. Here we constructed it with an explicit client, so
    // we close it. disconnect() is a hard close — quit() would wait on the
    // socket, which must not delay shutdown (or tests) when Redis is down.
    if (this.redis) {
      this.redis.redis.disconnect();
    }
  }

  /** The fallback in-memory storage arms setTimeout timers per hit — clear them. */
  onApplicationShutdown(): void {
    this.memory.onApplicationShutdown();
  }
}

/**
 * Binds the wrapper to the token @nestjs/throttler's ThrottlerGuard injects
 * (`ThrottlerStorage`). The module is registered AFTER ThrottlerModule in
 * AppModule; Nest resolves a duplicated provider token from the module that is
 * imported last, so this registration overrides the stock in-memory provider.
 */
export const RATE_LIMIT_STORAGE_PROVIDER = {
  provide: ThrottlerStorage,
  useClass: RateLimitStorageProvider,
};

@Global()
@Module({
  providers: [RATE_LIMIT_STORAGE_PROVIDER],
  exports: [RATE_LIMIT_STORAGE_PROVIDER],
})
export class RateLimitModule {}
