import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_ASSESSMENT_BANK,
  EXAM_QUESTION_BANK,
  MINI_IPIP_CITATION,
  MINI_IPIP_ITEMS,
  buildCourseCatalog,
  createDefaultSiteSettings,
  type CourseDbFile,
} from '@kia-academy/shared';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'KiaAcademy123!';

function loadCourseDb(): CourseDbFile {
  const candidates = [
    join(__dirname, '../../../db.json'),
    join(process.cwd(), 'db.json'),
    join(process.cwd(), '../../db.json'),
  ];
  for (const path of candidates) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as CourseDbFile;
    } catch {
      /* try next */
    }
  }
  throw new Error('Could not find db.json (expected at monorepo root)');
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kia.academy' },
    update: {
      name: 'Kia Academy Super Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      profileComplete: true,
    },
    create: {
      name: 'Kia Academy Super Admin',
      email: 'admin@kia.academy',
      passwordHash,
      role: 'SUPER_ADMIN',
      profileComplete: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'alex@kia.academy' },
    update: {
      name: 'Alex R.',
      passwordHash,
      profileComplete: true,
      firstName: 'Alex',
      lastName: 'R.',
      city: 'Tehran',
    },
    create: {
      name: 'Alex R.',
      email: 'alex@kia.academy',
      passwordHash,
      profileComplete: true,
      firstName: 'Alex',
      lastName: 'R.',
      city: 'Tehran',
      bootcampProfile: {
        create: {
          rank: 12,
          points: 340,
        },
      },
    },
  });

  const catalog = buildCourseCatalog(loadCourseDb());
  const seededCourses: { id: string; slug: string }[] = [];

  for (const course of catalog) {
    const row = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        icon: course.icon,
        trackKey: course.trackKey,
        sortOrder: course.sortOrder,
        published: true,
      },
      create: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        icon: course.icon,
        trackKey: course.trackKey,
        sortOrder: course.sortOrder,
        published: true,
      },
    });
    seededCourses.push({ id: row.id, slug: row.slug });

    for (const lesson of course.lessons) {
      await prisma.lesson.upsert({
        where: {
          courseId_slug: {
            courseId: row.id,
            slug: lesson.slug,
          },
        },
        update: {
          title: lesson.title,
          content: lesson.content,
          durationMin: lesson.durationMin,
          sortOrder: lesson.sortOrder,
          videoUrl: lesson.videoUrl,
        },
        create: {
          courseId: row.id,
          slug: lesson.slug,
          title: lesson.title,
          content: lesson.content,
          durationMin: lesson.durationMin,
          sortOrder: lesson.sortOrder,
          videoUrl: lesson.videoUrl,
        },
      });
    }
  }

  const interviewBranding = await prisma.course.upsert({
    where: { slug: 'interview-branding' },
    update: {
      title: 'Interview & Personal Branding',
      description: 'Build a standout portfolio, resume, and interview story that gets you hired.',
      icon: 'briefcase',
      trackKey: 'web',
      sortOrder: 100,
      published: true,
    },
    create: {
      slug: 'interview-branding',
      title: 'Interview & Personal Branding',
      description: 'Build a standout portfolio, resume, and interview story that gets you hired.',
      icon: 'briefcase',
      trackKey: 'web',
      sortOrder: 100,
      published: true,
    },
  });

  const brandingLessons = [
    {
      slug: 'portfolio-story',
      title: 'Portfolio Story',
      durationMin: 14,
      sortOrder: 1,
      content: `# Portfolio Story

Your portfolio should tell a clear story: who you are, what you build, and why it matters.

## Checklist
- Hero section with role + value proposition
- 2–3 featured projects with outcomes
- Contact link and GitHub profile`,
    },
    {
      slug: 'interview-framework',
      title: 'Interview Framework',
      durationMin: 16,
      sortOrder: 2,
      content: `# Interview Framework

Use STAR (Situation, Task, Action, Result) to answer behavioral questions.

## Tips
- Lead with impact, not tools
- Quantify results when possible
- Prepare 3 project deep-dives`,
    },
  ];

  for (const lesson of brandingLessons) {
    await prisma.lesson.upsert({
      where: {
        courseId_slug: {
          courseId: interviewBranding.id,
          slug: lesson.slug,
        },
      },
      update: {
        title: lesson.title,
        content: lesson.content,
        durationMin: lesson.durationMin,
        sortOrder: lesson.sortOrder,
      },
      create: {
        courseId: interviewBranding.id,
        ...lesson,
      },
    });
  }

  console.log(`Seeded admin user: ${admin.name} (${admin.email})`);
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log(`Seeded learner: ${user.name} (${user.email ?? 'alex@kia.academy'})`);
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log(
    `Seeded courses from db.json: ${seededCourses.map((c) => c.slug).join(', ')}, interview-branding`,
  );

  const defaults = createDefaultSiteSettings();
  await prisma.siteSetting.upsert({
    where: { key: 'site' },
    create: { key: 'site', value: JSON.stringify(defaults) },
    update: {
      // Keep evolving defaults in sync for local/dev seeds (pricing + payment + sms + enamad).
      value: JSON.stringify(defaults),
    },
  });
  console.log('Seeded site settings');

  const testBanks = [
    {
      id: 'personality',
      payload: {
        version: 1,
        citation: MINI_IPIP_CITATION,
        items: MINI_IPIP_ITEMS.map((item) => ({ ...item })),
      },
    },
    {
      id: 'assessment',
      payload: structuredClone(DEFAULT_ASSESSMENT_BANK),
    },
    {
      id: 'readiness',
      payload: { version: 1, questions: structuredClone(EXAM_QUESTION_BANK) },
    },
  ] as const;

  for (const bank of testBanks) {
    await prisma.testBank.upsert({
      where: { id: bank.id },
      create: { id: bank.id, payload: JSON.stringify(bank.payload) },
      update: { payload: JSON.stringify(bank.payload) },
    });
  }
  console.log('Seeded test banks: personality, assessment, readiness');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
