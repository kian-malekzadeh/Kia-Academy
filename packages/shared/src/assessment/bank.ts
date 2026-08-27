import type { AssessmentBank } from './types';

/** Default goal-wizard bank — mirrors current i18n + wizardOptions. */
export const DEFAULT_ASSESSMENT_BANK: AssessmentBank = {
  version: 1,
  questions: [
    {
      id: 'goal',
      order: 1,
      kind: 'single_choice',
      stageLabel: { fa: 'هدف', en: 'Goal' },
      title: {
        fa: 'چه چیزی تو را به سمت کد می‌کشاند؟',
        en: "What's pulling you toward code?",
      },
      description: {
        fa: 'این لحن و سرعت کل نقشه راه شما را شکل می‌دهد.',
        en: 'This shapes the tone and pace of your whole roadmap.',
      },
      options: [
        {
          value: 'job',
          icon: '💼',
          title: { fa: 'پیدا کردن شغل', en: 'Get a Job' },
          description: { fa: 'دریافت نقش به‌عنوان توسعه‌دهنده', en: 'Land a role as a developer' },
        },
        {
          value: 'startup',
          icon: '🚀',
          title: { fa: 'ساختن استارتاپ', en: 'Build a Startup' },
          description: { fa: 'منتشر کردن محصول خود', en: 'Ship your own product' },
        },
        {
          value: 'freelance',
          icon: '🧭',
          title: { fa: 'فریلنس', en: 'Freelance' },
          description: {
            fa: 'مستقل و با شرایط خودت کار کن',
            en: 'Work independently, on your terms',
          },
        },
        {
          value: 'fun',
          icon: '🎨',
          title: { fa: 'یادگیری برای سرگرمی', en: 'Learn for Fun' },
          description: { fa: 'کنجکاوی، بدون فشار', en: 'Curiosity, no pressure' },
        },
      ],
    },
    {
      id: 'skill',
      order: 2,
      kind: 'skills_matrix',
      stageLabel: { fa: 'مهارت', en: 'Skill' },
      title: { fa: 'حالا چقدر راحت هستی؟', en: 'How comfortable are you already?' },
      description: {
        fa: 'صادق باش — این فقط به تنظیم سختی کمک می‌کند.',
        en: 'Be honest — this only helps us calibrate difficulty.',
      },
      skillTopics: [
        { key: 'HTML/CSS', label: { fa: 'HTML/CSS', en: 'HTML/CSS' } },
        { key: 'JavaScript', label: { fa: 'JavaScript', en: 'JavaScript' } },
        { key: 'Python', label: { fa: 'Python', en: 'Python' } },
      ],
      skillLevels: [
        { value: 'Never used', label: { fa: 'هرگز استفاده نکرده‌ام', en: 'Never used' } },
        { value: 'Beginner', label: { fa: 'مبتدی', en: 'Beginner' } },
        { value: 'Comfortable', label: { fa: 'راحت', en: 'Comfortable' } },
      ],
    },
    {
      id: 'personality',
      order: 3,
      kind: 'sliders',
      stageLabel: { fa: 'شخصیت', en: 'Personality' },
      title: { fa: 'دوست داری چطور کار کنی؟', en: 'How do you like to work?' },
      description: {
        fa: 'پاسخ غلطی وجود ندارد — این فرمت پروژه‌هایت را تنظیم می‌کند.',
        en: "There's no wrong answer — this tunes your project format.",
      },
      sliderLabels: {
        workingStyle: { fa: 'سبک کار', en: 'Working style' },
        pace: { fa: 'آهنگ', en: 'Pace' },
        solo: { fa: 'تمرکز فردی', en: 'Solo focus' },
        team: { fa: 'همکاری تیمی', en: 'Team collaboration' },
        structured: { fa: 'ساخت‌یافته، مرحله‌به‌مرحله', en: 'Structured, step-by-step' },
        exploratory: { fa: 'انعطاف‌پذیر، کشفی', en: 'Flexible, exploratory' },
      },
    },
    {
      id: 'interest',
      order: 4,
      kind: 'multi_choice',
      stageLabel: { fa: 'علاقه', en: 'Interest' },
      title: {
        fa: 'کدام حوزه‌ها شما را ذوق‌زده می‌کند؟',
        en: 'Which domains excite you?',
      },
      description: {
        fa: 'تا 2 مورد انتخاب کن — مسیرت را دور آنها می‌سازیم.',
        en: "Pick up to 2 — we'll build your track around them.",
      },
      maxSelections: 2,
      options: [
        {
          value: 'web',
          icon: '🌐',
          title: { fa: 'توسعه وب', en: 'Web Development' },
          description: { fa: 'سایت‌ها، اپ‌ها، وابست‌ها', en: 'Sites, apps, interfaces' },
        },
        {
          value: 'ai',
          icon: '🤖',
          title: { fa: 'هوش مصنوعی / یادگیری ماشین', en: 'AI / Machine Learning' },
          description: { fa: 'مدل‌ها، داده، اتوماسیون', en: 'Models, data, automation' },
        },
        {
          value: 'mobile',
          icon: '📱',
          title: { fa: 'توسعه موبایل', en: 'Mobile Development' },
          description: { fa: 'اپ‌های iOS و Android', en: 'iOS & Android apps' },
        },
        {
          value: 'game',
          icon: '🎮',
          title: { fa: 'توسعه بازی', en: 'Game Development' },
          description: { fa: 'تجربه‌های تعاملی', en: 'Interactive experiences' },
        },
        {
          value: 'data',
          icon: '📊',
          title: { fa: 'داده و تحلیل', en: 'Data & Analytics' },
          description: { fa: 'بینش از اطلاعات', en: 'Insights from information' },
        },
        {
          value: 'backend',
          icon: '🛠️',
          title: { fa: 'بک‌اند و سیستم‌ها', en: 'Backend & Systems' },
          description: { fa: 'APIها، سرورها، زیرساخت', en: 'APIs, servers, infrastructure' },
        },
      ],
    },
    {
      id: 'learningStyle',
      order: 5,
      kind: 'single_choice',
      stageLabel: { fa: 'سبک یادگیری', en: 'Learning Style' },
      title: { fa: 'چگونه بهتر یاد می‌گیری؟', en: 'How do you learn best?' },
      description: {
        fa: 'ابتدا ماژول‌هایت را به سمت این فرمت وزن می‌دهیم.',
        en: "We'll weight your modules toward this format first.",
      },
      options: [
        {
          value: 'video',
          icon: '🎬',
          title: { fa: 'مشاهده ویدئو', en: 'Watching Videos' },
          description: { fa: 'راهنماهای هدایت‌شده و گفتاری', en: 'Guided, narrated walkthroughs' },
        },
        {
          value: 'reading',
          icon: '📖',
          title: { fa: 'مطالعه مستندات و متن', en: 'Reading Docs & Text' },
          description: { fa: 'مرجع جزئی با سرعت خود', en: 'Self-paced, detailed reference' },
        },
        {
          value: 'building',
          icon: '🧩',
          title: { fa: 'ساختن فوری پروژه', en: 'Building Projects Immediately' },
          description: { fa: 'یادگیری با عمل، خودت پیدا کن', en: 'Learn by doing, figure it out' },
        },
      ],
    },
    {
      id: 'time',
      order: 6,
      kind: 'hours',
      stageLabel: { fa: 'زمان', en: 'Time' },
      title: {
        fa: 'چقدر زمان می‌توانی اختصاص دهی؟',
        en: 'How much time can you give this?',
      },
      description: {
        fa: 'سرعت نقشه راهت با زندگی واقعی تنظیم می‌شود.',
        en: 'Your roadmap pace adjusts to fit real life.',
      },
      hours: {
        min: 3,
        max: 40,
        label: { fa: 'ساعت در هفته: {hours}ساعت', en: 'Hours per week: {hours}h' },
        aria: { fa: 'ساعت‌های دردسترس در هفته', en: 'Hours available per week' },
      },
    },
  ],
};
