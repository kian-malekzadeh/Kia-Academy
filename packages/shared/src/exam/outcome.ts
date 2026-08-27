import {
  EXAM_DOMAINS,
  type ExamDomainId,
  type ExamOutcome,
  type ExamSubmitResult,
  type LocaleText,
} from './types';

export const DOMAIN_REFRESHER_NAME: Record<ExamDomainId, string> = {
  digitalOps: 'Refresher: Digital workplace',
  logicalReasoning: 'Refresher: Logical thinking',
  techReading: 'Refresher: Tech reading',
  codeSense: 'Refresher: Code basics',
  problemSolving: 'Refresher: Problem solving',
};

export function buildExamVerdict(args: {
  passed: boolean;
  average: number;
  outcome: ExamOutcome;
}): ExamSubmitResult['verdict'] {
  if (args.passed) {
    const unlocked = args.outcome.modulesUnlocked[0];
    const title: LocaleText = {
      fa: 'آماده‌ای — نقشه راهت به‌روز شد',
      en: "You're ready — your roadmap is updated",
    };
    const message: LocaleText = {
      fa: `میانگین شما ${args.average}% است. اولین ماژول مسیر${unlocked ? ` («${unlocked}»)` : ''} باز شد${
        args.outcome.levelAfter !== args.outcome.levelBefore
          ? ' و سطح شما ارتقا یافت'
          : ''
      }.`,
      en: `Your average is ${args.average}%. Your first path module${
        unlocked ? ` (“${unlocked}”)` : ''
      } is unlocked${
        args.outcome.levelAfter !== args.outcome.levelBefore
          ? ' and your level was raised'
          : ''
      }.`,
    };
    return {
      icon: '✅',
      title,
      message,
      unlockTitle: {
        fa: 'ادامه روی نقشه راه شخصی',
        en: 'Continue on your personal roadmap',
      },
      unlockSub: {
        fa: 'نتیجهٔ این آزمون مستقیماً روی ماژول‌های باز و ترتیب مسیر اثر گذاشت.',
        en: 'This exam result directly unlocked modules and adjusted your path.',
      },
      variant: 'success',
    };
  }

  const refreshers = args.outcome.refreshersInserted;
  const title: LocaleText = {
    fa: 'یک مرور کوتاه قبل از ادامه',
    en: 'A short refresher before you continue',
  };
  const message: LocaleText = {
    fa:
      refreshers.length > 0
        ? `میانگین شما ${args.average}% است. ${refreshers.length} ماژول مرور به ابتدای نقشه راه اضافه شد تا نقاط ضعف پوشش داده شود.`
        : `میانگین شما ${args.average}% است. قبل از باز شدن مرحله بعد، یک مرور کوتاه پیشنهاد می‌شود.`,
    en:
      refreshers.length > 0
        ? `Your average is ${args.average}%. ${refreshers.length} refresher module(s) were added at the start of your roadmap to cover weak areas.`
        : `Your average is ${args.average}%. A short review is recommended before unlocking the next stage.`,
  };
  return {
    icon: '🧭',
    title,
    message,
    unlockTitle: {
      fa: 'مرورها در نقشه راه صف شدند',
      en: 'Refreshers are queued on your roadmap',
    },
    unlockSub: {
      fa: 'پس از تکمیل مرورها، مسیر اصلی دوباره در دسترس است.',
      en: 'After the refreshers, your main path is available again.',
    },
    variant: 'warning',
  };
}

export function buildExamOutcome(args: {
  passed: boolean;
  average: number;
  percentages: Record<string, number>;
  roadmap: { id: string; modules: string[]; level: string } | null;
  weakThreshold?: number;
}): ExamOutcome {
  const weakThreshold = args.weakThreshold ?? 50;

  const weakDomains = EXAM_DOMAINS.filter(
    (domain) => (args.percentages[domain] ?? 0) < weakThreshold,
  );

  const domainScores = Object.fromEntries(
    EXAM_DOMAINS.map((domain) => [domain, args.percentages[domain] ?? 0]),
  ) as Record<ExamDomainId, number>;

  if (!args.roadmap) {
    return {
      passed: args.passed,
      average: args.average,
      domainScores,
      weakDomains,
      refreshersInserted: [],
      modulesUnlocked: [],
      levelBefore: '',
      levelAfter: '',
      roadmapId: null,
      roadmapModules: [],
    };
  }

  const { roadmap } = args;
  const levelBefore = roadmap.level;

  if (args.passed) {
    const modulesUnlocked = [roadmap.modules[0]].filter(Boolean);
    const levelAfter =
      args.average >= 85 && roadmap.level === 'absoluteBeginner'
        ? 'confidentBeginner'
        : roadmap.level;

    return {
      passed: true,
      average: args.average,
      domainScores,
      weakDomains,
      refreshersInserted: [],
      modulesUnlocked,
      levelBefore,
      levelAfter,
      roadmapId: roadmap.id,
      roadmapModules: [...roadmap.modules],
    };
  }

  const refreshersInserted: string[] = [];
  const seen = new Set<string>();
  for (const domain of weakDomains) {
    const name = DOMAIN_REFRESHER_NAME[domain];
    if (!seen.has(name)) {
      seen.add(name);
      refreshersInserted.push(name);
    }
  }

  const roadmapModules = [
    ...refreshersInserted,
    ...roadmap.modules.filter((m) => !seen.has(m)),
  ];

  return {
    passed: false,
    average: args.average,
    domainScores,
    weakDomains,
    refreshersInserted,
    modulesUnlocked: [],
    levelBefore,
    levelAfter: roadmap.level,
    roadmapId: roadmap.id,
    roadmapModules,
  };
}
