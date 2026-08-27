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
  // ---- Sample course exam (attached to the first JS course when present) ----
  const examCourse =
    (await prisma.course.findFirst({ where: { slug: { contains: 'js' } } })) ??
    (await prisma.course.findFirst());
  const sampleExamTitle = 'آزمون جامع جاوااسکریپت';
  if (examCourse && !(await prisma.courseExam.findFirst({ where: { title: sampleExamTitle } }))) {
    await prisma.courseExam.create({
      data: {
        courseId: examCourse.id,
        title: sampleExamTitle,
        description: 'پوشش همهٔ ماژول‌های دوره: متغیرها، توابع، آرایه‌ها، رویدادها و DOM.',
        passScore: 60,
        durationMin: 10,
        published: true,
        sortOrder: 0,
        questions: JSON.stringify([
          {
            id: 'q1', type: 'single_choice',
            prompt: 'خروجی کد زیر چیست؟\n\nlet x = 5; { let x = 10; } console.log(x);',
            options: [
              { id: 'a', label: '۵' },
              { id: 'b', label: '۱۰' },
              { id: 'c', label: 'undefined' },
              { id: 'd', label: 'خطای ReferenceError' },
            ],
            answer: 'a',
          },
          {
            id: 'q2', type: 'single_choice',
            prompt: 'کدام روش آرایه، یک آرایهٔ جدید برمی‌گرداند و آرایهٔ اصلی را تغییر نمی‌دهد؟',
            options: [
              { id: 'a', label: 'push' },
              { id: 'b', label: 'map' },
              { id: 'c', label: 'splice' },
              { id: 'd', label: 'sort' },
            ],
            answer: 'b',
          },
          {
            id: 'q3', type: 'multi_choice',
            prompt: 'کدام گزینه‌ها مقادیر falsy در جاوااسکریپت هستند؟',
            options: [
              { id: 'a', label: '۰ (صفر)' },
              { id: 'b', label: "'' (رشتهٔ خالی)" },
              { id: 'c', label: '[] (آرایهٔ خالی)' },
              { id: 'd', label: 'NaN' },
            ],
            answer: ['a', 'b', 'd'],
          },
          {
            id: 'q4', type: 'single_choice',
            prompt: 'تفاوت == و === در چیست؟',
            options: [
              { id: 'a', label: 'هیچ تفاوتی ندارند' },
              { id: 'b', label: '== نوع‌ها را مقایسه می‌کند، === مقدار را' },
              { id: 'c', label: '=== پیش از مقایسه تبدیل نوع انجام نمی‌دهد' },
              { id: 'd', label: '== فقط برای اعداد است' },
            ],
            answer: 'c',
          },
          {
            id: 'q5', type: 'multi_choice',
            prompt: 'کدام‌ها روش‌های انتخاب عنصر در DOM هستند؟',
            options: [
              { id: 'a', label: 'document.querySelector' },
              { id: 'b', label: 'document.createElement' },
              { id: 'c', label: 'element.addEventListener' },
              { id: 'd', label: 'document.getElementById' },
            ],
            answer: ['a', 'd'],
          },
        ]),
      },
    });
    console.log('Seeded sample course exam');
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
