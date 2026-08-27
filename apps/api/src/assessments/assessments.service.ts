import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssessmentAnswers, AssessmentResponse } from '@kia-academy/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssessmentDto, userId: string): Promise<AssessmentResponse> {
    const record = await this.prisma.assessment.create({
      data: {
        userId,
        answers: JSON.stringify(dto.answers),
      },
    });

    return this.toResponse(record);
  }

  async findOne(id: string, userId: string): Promise<AssessmentResponse> {
    const record = await this.prisma.assessment.findFirst({
      where: { id, userId },
    });
    if (!record) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }
    return this.toResponse(record);
  }

  async latestForUser(userId: string): Promise<AssessmentResponse | null> {
    const record = await this.prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return record ? this.toResponse(record) : null;
  }

  async findForUser(id: string, userId: string): Promise<AssessmentResponse | null> {
    const record = await this.prisma.assessment.findFirst({
      where: { id, userId },
    });
    return record ? this.toResponse(record) : null;
  }

  private toResponse(record: { id: string; answers: string; createdAt: Date }): AssessmentResponse {
    return {
      id: record.id,
      answers: JSON.parse(record.answers) as AssessmentAnswers,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
