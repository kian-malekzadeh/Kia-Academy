import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { CoursesModule } from './courses/courses.module';
import { CourseExamsModule } from './course-exams/course-exams.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { PersonalityModule } from './personality/personality.module';
import { RoadmapsModule } from './roadmaps/roadmaps.module';
import { ReadinessModule } from './readiness/readiness.module';
import { BootcampModule } from './bootcamp/bootcamp.module';
import { ChallengesModule } from './challenges/challenges.module';
import { StripeModule } from './stripe/stripe.module';
import { EmailModule } from './email/email.module';
import { AdminModule } from './admin/admin.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { ContactModule } from './contact/contact.module';
import { TestBanksModule } from './test-banks/test-banks.module';
import { TicketsModule } from './tickets/tickets.module';
import { TodosModule } from './todos/todos.module';
import { MessagesModule } from './messages/messages.module';
import { CompetitionsModule } from './competitions/competitions.module';
import { CartModule } from './cart/cart.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  controllers: [AppController],
  imports: [
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [
    '../../.env',
    '.env',
  ],
  validationSchema: envValidationSchema,
}),    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    HealthModule,
    PaymentsModule,
    CartModule,
    CoursesModule,
    CourseExamsModule,
    AssessmentsModule,
    PersonalityModule,
    RoadmapsModule,
    ReadinessModule,
    BootcampModule,
    ChallengesModule,
    StripeModule,
    EmailModule,
    AdminModule,
    SiteSettingsModule,
    ContactModule,
    TestBanksModule,
    TicketsModule,
    TodosModule,
    MessagesModule,
    CompetitionsModule,
    ProgressModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
