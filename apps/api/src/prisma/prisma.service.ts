import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Prisma 7 connects through driver adapters — the datasource URL is not
    // baked into the generated client anymore (it lives in prisma.config.ts
    // for Migrate; here it is passed explicitly to the pg adapter).
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
