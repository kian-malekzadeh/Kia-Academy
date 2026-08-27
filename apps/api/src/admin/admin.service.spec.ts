import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AssessmentsService } from '../assessments/assessments.service';
import { CoursesService } from '../courses/courses.service';

describe('AdminService.getStats', () => {
  it('returns the shared flat AdminStats shape', async () => {
    const prisma = {
      user: { count: jest.fn().mockResolvedValue(10) },
      course: { count: jest.fn().mockResolvedValue(4) },
      lesson: { count: jest.fn().mockResolvedValue(20) },
      challenge: {
        count: jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(2),
      },
      payment: {
        count: jest.fn().mockResolvedValue(7),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amountCents: 19000 } }),
      },
      enrollment: { count: jest.fn().mockResolvedValue(12) },
    };

    const service = new AdminService(
      prisma as never,
      {
        deleteByPublicUrl: jest.fn(),
        clearLessonDir: jest.fn(),
        saveLessonVideo: jest.fn(),
      } as never,
      { get: jest.fn() } as never,
    );
    await expect(service.getStats()).resolves.toEqual({
      users: 10,
      courses: 4,
      lessons: 20,
      enrollments: 12,
      payments: 7,
      revenueCents: 19000,
      challenges: 5,
      activeChallenges: 2,
    });
  });
});

describe('AdminService.createLesson', () => {
  it('creates a lesson under a course slug', async () => {
    const prisma = {
      course: {
        findUnique: jest.fn().mockResolvedValue({ id: 'c1', slug: 'js-core' }),
      },
      lesson: {
        findFirst: jest.fn().mockResolvedValue(null),
        aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: 1 } }),
        create: jest.fn().mockResolvedValue({
          id: 'l1',
          slug: 'intro',
          title: 'Intro',
          content: '# Hello',
          videoUrl: null,
          durationMin: 10,
          sortOrder: 2,
        }),
      },
    };

    const service = new AdminService(
      prisma as never,
      {
        deleteByPublicUrl: jest.fn(),
        clearLessonDir: jest.fn(),
        saveLessonVideo: jest.fn(),
      } as never,
      { get: jest.fn() } as never,
    );
    const lesson = await service.createLesson('js-core', {
      slug: 'intro',
      title: 'Intro',
      content: '# Hello',
    });

    expect(lesson.slug).toBe('intro');
    expect(prisma.lesson.create).toHaveBeenCalled();
  });
});

describe('ownership and lesson completion', () => {
  it('AssessmentsService.findOne rejects foreign assessments', async () => {
    const prisma = {
      assessment: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new AssessmentsService(prisma as never);
    await expect(service.findOne('a1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.assessment.findFirst).toHaveBeenCalledWith({
      where: { id: 'a1', userId: 'user-1' },
    });
  });

  it('CoursesService.markComplete resolves lesson by course and lesson slug', async () => {
    const prisma = {
      course: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'c1',
          slug: 'js-core',
          published: true,
          enrollments: [{ id: 'e1' }],
          lessons: [
            {
              id: 'l1',
              slug: 'intro',
              title: 'Intro',
              durationMin: 10,
            },
          ],
        }),
      },
      lessonProgress: {
        upsert: jest.fn().mockResolvedValue({ completed: true }),
      },
      entitlement: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ent-1' }),
      },
    };

    const mediaService = {
      createSignedVideoUrl: jest.fn(),
    };

    const service = new CoursesService(prisma as never, mediaService as never);
    const result = await service.markComplete('user-1', 'js-core', 'intro');
    expect(result).toEqual({
      id: 'l1',
      slug: 'intro',
      title: 'Intro',
      durationMin: 10,
      completed: true,
    });
  });
});
