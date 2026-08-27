import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChallengeScoreResult } from '@kia-academy/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';
import { buildChallengeResult } from '@kia-academy/shared';
import { CreateChallengeSubmissionDto } from './dto/create-challenge-submission.dto';

export interface ChallengeSubmissionResponse extends ChallengeScoreResult {
  id: string;
  createdAt: string;
}

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  async create(
    dto: CreateChallengeSubmissionDto,
    userId: string,
  ): Promise<ChallengeSubmissionResponse> {
    const settings = await this.siteSettings.get();
    const result = buildChallengeResult(dto.code, settings.bootcamp);

    const record = await this.prisma.challengeSubmission.create({
      data: {
        userId,
        code: dto.code,
        score: result.score,
        topScore: result.topScore,
        result: JSON.stringify(result),
      },
    });

    if (result.topScore) {
      await this.prisma.bootcampProfile.updateMany({
        where: { userId },
        data: { rank: 1, points: result.score },
      });

      const course = await this.prisma.course.findUnique({
        where: { slug: settings.bootcamp.unlockCourseSlug },
      });
      if (course) {
        await this.prisma.entitlement.upsert({
          where: {
            userId_resourceType_resourceId: {
              userId,
              resourceType: 'course',
              resourceId: course.slug,
            },
          },
          create: {
            userId,
            resourceType: 'course',
            resourceId: course.slug,
            source: 'CHALLENGE',
          },
          update: {},
        });
      }
    }

    return {
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      ...result,
    };
  }

  async findOne(id: string, userId: string): Promise<ChallengeSubmissionResponse> {
    const record = await this.prisma.challengeSubmission.findFirst({
      where: { id, userId },
    });
    if (!record) {
      throw new NotFoundException(`Challenge submission ${id} not found`);
    }

    const result = JSON.parse(record.result) as ChallengeScoreResult;
    return {
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      ...result,
    };
  }
}
