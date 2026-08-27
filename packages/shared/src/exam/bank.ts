import type { ExamQuestion } from './types';

/** Full digital readiness exam bank — 4 questions × 5 domains = 20. */
export const EXAM_QUESTION_BANK: ExamQuestion[] = [
  // ── digitalOps ──────────────────────────────────────────────────────────
  {
    id: 'do-01',
    domain: 'digitalOps',
    type: 'single_choice',
    prompt: {
      fa: 'برای نگه‌داشتن پروژه‌های کدنویسی جدا از فایل‌های شخصی، بهترین روش کدام است؟',
      en: 'To keep coding projects separate from personal files, which approach is best?',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'همه فایل‌ها را روی دسکتاپ بریزید',
          en: 'Dump every file onto the Desktop',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'یک پوشهٔ اصلی مثل Projects بسازید و داخل آن برای هر پروژه پوشهٔ جدا بگذارید',
          en: 'Create a top-level folder such as Projects and a subfolder for each project',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'فقط در دانلودها ذخیره کنید',
          en: 'Save everything only in Downloads',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'نام فایل‌ها را تصادفی بگذارید تا پیدا کردنشان سخت باشد',
          en: 'Give files random names so they are harder to find',
        },
      },
    ],
    answer: 'b',
    points: 1,
  },
  {
    id: 'do-02',
    domain: 'digitalOps',
    type: 'multi_choice',
    prompt: {
      fa: 'کدام موارد عادت‌های امن برای رمز عبور حساب‌های آموزشی و کدنویسی هستند؟ (چند گزینه)',
      en: 'Which of these are safe password habits for learning and coding accounts? (select all that apply)',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'استفاده از رمز یکتا و طولانی برای هر سرویس مهم',
          en: 'Using a unique, long password for each important service',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'نوشتن رمز روی برچسب چسبیده به مانیتور',
          en: 'Writing the password on a sticky note on the monitor',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'فعال کردن تأیید دومرحله‌ای در صورت پشتیبانی سرویس',
          en: 'Enabling two-factor authentication when the service supports it',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'اشتراک‌گذاری رمز با هم‌تیمی از طریق چت عمومی کلاس',
          en: 'Sharing the password with classmates in a public class chat',
        },
      },
    ],
    answer: ['a', 'c'],
    points: 1,
  },
  {
    id: 'do-03',
    domain: 'digitalOps',
    type: 'order',
    prompt: {
      fa: 'مراحل منطقی همگام‌سازی یک پوشهٔ پروژه با فضای ابری را به ترتیب درست بچینید.',
      en: 'Put these steps for syncing a project folder to the cloud in the correct order.',
    },
    orderItems: [
      {
        id: 'step-c',
        label: {
          fa: 'صبر کنید تا وضعیت همگام‌سازی «تمام‌شده / همگام» شود',
          en: 'Wait until the sync status shows complete / up to date',
        },
      },
      {
        id: 'step-a',
        label: {
          fa: 'وارد حساب سرویس ابری شوید و همگام‌سازی را نصب یا فعال کنید',
          en: 'Sign in to the cloud service and install or enable sync',
        },
      },
      {
        id: 'step-d',
        label: {
          fa: 'از دستگاه دیگر پوشه را باز کنید و نسخهٔ به‌روز را بررسی کنید',
          en: 'Open the folder on another device and confirm the updated copy',
        },
      },
      {
        id: 'step-b',
        label: {
          fa: 'پوشهٔ پروژه را به مسیر همگام‌سازی ابری منتقل یا انتخاب کنید',
          en: 'Move or select the project folder into the cloud sync path',
        },
      },
    ],
    answer: ['step-a', 'step-b', 'step-c', 'step-d'],
    points: 1,
  },
  {
    id: 'do-04',
    domain: 'digitalOps',
    type: 'fill_blank',
    prompt: {
      fa: 'در بیشتر سیستم‌عامل‌ها، میانبر صفحه‌کلید برای «کپی» ترکیب کلید Ctrl (یا Cmd) به‌همراه حرف ____ است.',
      en: 'On most operating systems, the keyboard shortcut for Copy is Ctrl (or Cmd) plus the letter ____.',
    },
    blanks: 1,
    blankPlaceholders: [{ fa: 'یک حرف', en: 'one letter' }],
    answer: ['c'],
    points: 1,
  },

  // ── logicalReasoning ────────────────────────────────────────────────────
  {
    id: 'lr-01',
    domain: 'logicalReasoning',
    type: 'single_choice',
    prompt: {
      fa: 'اگر نمره ≥ ۷۰ باشد پیام «قبول» چاپ شود، وگرنه «مردود». برای نمرهٔ ۶۵ خروجی چیست؟',
      en: 'If score ≥ 70 print “pass”, otherwise “fail”. For score 65, what is the output?',
    },
    options: [
      { id: 'a', label: { fa: 'قبول', en: 'pass' } },
      { id: 'b', label: { fa: 'مردود', en: 'fail' } },
      { id: 'c', label: { fa: 'هیچ خروجی‌ای نیست', en: 'no output' } },
      { id: 'd', label: { fa: 'خطا', en: 'error' } },
    ],
    answer: 'b',
    points: 1,
  },
  {
    id: 'lr-02',
    domain: 'logicalReasoning',
    type: 'single_choice',
    prompt: {
      fa: 'الگو را کامل کنید: ۲، ۴، ۸، ۱۶، __',
      en: 'Complete the pattern: 2, 4, 8, 16, __',
    },
    options: [
      { id: 'a', label: { fa: '۱۸', en: '18' } },
      { id: 'b', label: { fa: '۲۴', en: '24' } },
      { id: 'c', label: { fa: '۳۲', en: '32' } },
      { id: 'd', label: { fa: '۲۰', en: '20' } },
    ],
    answer: 'c',
    points: 1,
  },
  {
    id: 'lr-03',
    domain: 'logicalReasoning',
    type: 'order',
    prompt: {
      fa: 'برای دیباگ یک باگ گزارش‌شده، ترتیب منطقی کار را بچینید.',
      en: 'Order these steps for debugging a reported bug logically.',
    },
    orderItems: [
      {
        id: 's3',
        label: {
          fa: 'تغییر کوچک اعمال کنید و دوباره تست کنید',
          en: 'Apply a small fix and retest',
        },
      },
      {
        id: 's1',
        label: {
          fa: 'مشکل را با ورودی مشخص بازتولید کنید',
          en: 'Reproduce the problem with a concrete input',
        },
      },
      {
        id: 's4',
        label: {
          fa: 'نتیجه را ثبت کنید و در صورت نیاز اصلاح را نهایی کنید',
          en: 'Record the result and finalize the fix if needed',
        },
      },
      {
        id: 's2',
        label: {
          fa: 'محل احتمالی خطا را در کد یا لاگ پیدا کنید',
          en: 'Locate the likely fault in code or logs',
        },
      },
    ],
    answer: ['s1', 's2', 's3', 's4'],
    points: 1,
  },
  {
    id: 'lr-04',
    domain: 'logicalReasoning',
    type: 'multi_choice',
    prompt: {
      fa: 'کدام گزاره‌ها دربارهٔ توالی درست هستند؟ (چند گزینه)',
      en: 'Which statements about sequences are true? (select all that apply)',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'ترتیب مراحل می‌تواند نتیجهٔ نهایی را تغییر دهد',
          en: 'The order of steps can change the final result',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'در یک توالی خطی، هر مرحله بعد از مرحلهٔ قبلی اجرا می‌شود',
          en: 'In a linear sequence, each step runs after the previous one',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'ترتیب مراحل هرگز اهمیتی ندارد',
          en: 'Step order never matters',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'شرط if می‌تواند مسیر توالی را شاخه کند',
          en: 'An if-condition can branch which path the sequence takes',
        },
      },
    ],
    answer: ['a', 'b', 'd'],
    points: 1,
  },

  // ── techReading ─────────────────────────────────────────────────────────
  {
    id: 'tr-01',
    domain: 'techReading',
    type: 'single_choice',
    prompt: {
      fa: 'متن: "A commit saves a snapshot of your project so you can review history and undo changes later." بر اساس متن، commit چه کاری می‌کند؟',
      en: 'Text: "A commit saves a snapshot of your project so you can review history and undo changes later." According to the text, what does a commit do?',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'پروژه را برای همیشه از رایانه پاک می‌کند',
          en: 'Permanently deletes the project from the computer',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'یک تصویر لحظه‌ای از پروژه ذخیره می‌کند تا بعداً تاریخچه را ببینید',
          en: 'Saves a snapshot of the project so you can review history later',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'فقط فونت ویرایشگر را عوض می‌کند',
          en: 'Only changes the editor font',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'رمز وای‌فای را تنظیم می‌کند',
          en: 'Configures the Wi-Fi password',
        },
      },
    ],
    answer: 'b',
    points: 1,
  },
  {
    id: 'tr-02',
    domain: 'techReading',
    type: 'single_choice',
    prompt: {
      fa: 'متن: "An API lets one program request data or actions from another program over a network." مفهوم اصلی متن چیست؟',
      en: 'Text: "An API lets one program request data or actions from another program over a network." What is the main idea?',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'API برنامه‌ها را قادر می‌کند از طریق شبکه از هم داده یا عمل بخواهند',
          en: 'An API lets programs request data or actions from each other over a network',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'API فقط برای طراحی پوستر است',
          en: 'An API is only used for poster design',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'API جایگزین کیبورد می‌شود',
          en: 'An API replaces the keyboard',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'API فقط روی کاغذ چاپ می‌شود',
          en: 'An API only exists as a printed page',
        },
      },
    ],
    answer: 'a',
    points: 1,
  },
  {
    id: 'tr-03',
    domain: 'techReading',
    type: 'fill_blank',
    prompt: {
      fa: 'متن: "A bug is an error in software that causes incorrect behavior." طبق متن، bug یک ____ در نرم‌افزار است.',
      en: 'Text: "A bug is an error in software that causes incorrect behavior." According to the text, a bug is an ____ in software.',
    },
    blanks: 1,
    blankPlaceholders: [{ fa: 'یک واژهٔ انگلیسی', en: 'one English word' }],
    answer: ['error'],
    points: 1,
  },
  {
    id: 'tr-04',
    domain: 'techReading',
    type: 'multi_choice',
    prompt: {
      fa: 'متن: "Deploy means publishing your app so users can access it on a server or hosting service. Before deploy, teams usually run tests." متن کدام موارد را می‌گوید؟ (چند گزینه)',
      en: 'Text: "Deploy means publishing your app so users can access it on a server or hosting service. Before deploy, teams usually run tests." Which statements does the text support? (select all that apply)',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'Deploy یعنی انتشار برنامه برای دسترسی کاربران',
          en: 'Deploy means publishing the app so users can access it',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'قبل از deploy معمولاً تست اجرا می‌شود',
          en: 'Teams usually run tests before deploy',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'Deploy فقط به‌معنای خاموش کردن رایانه است',
          en: 'Deploy only means shutting down the computer',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'میزبانی می‌تواند روی سرور یا سرویس hosting باشد',
          en: 'Hosting can be on a server or hosting service',
        },
      },
    ],
    answer: ['a', 'b', 'd'],
    points: 1,
  },

  // ── codeSense ───────────────────────────────────────────────────────────
  {
    id: 'cs-01',
    domain: 'codeSense',
    type: 'single_choice',
    prompt: {
      fa: 'خروجی این قطعه چیست؟\nlet n = 3;\nconsole.log(n + 2);',
      en: 'What does this snippet print?\nlet n = 3;\nconsole.log(n + 2);',
    },
    options: [
      { id: 'a', label: { fa: '۳', en: '3' } },
      { id: 'b', label: { fa: '۵', en: '5' } },
      { id: 'c', label: { fa: '۳۲', en: '32' } },
      { id: 'd', label: { fa: 'undefined', en: 'undefined' } },
    ],
    answer: 'b',
    points: 1,
  },
  {
    id: 'cs-02',
    domain: 'codeSense',
    type: 'fill_blank',
    prompt: {
      fa: 'در کد مقابل، نام متغیر چیست؟\nconst score = 10;',
      en: 'In the code below, what is the variable name?\nconst score = 10;',
    },
    blanks: 1,
    blankPlaceholders: [{ fa: 'نام متغیر', en: 'variable name' }],
    answer: ['score'],
    points: 1,
  },
  {
    id: 'cs-03',
    domain: 'codeSense',
    type: 'single_choice',
    prompt: {
      fa: 'کدام قطعه باگ دارد؟ (هدف: چاپ اعداد ۰ تا ۲)',
      en: 'Which snippet has a bug? (goal: print numbers 0 through 2)',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'for (let i = 0; i < 3; i++) { console.log(i); }',
          en: 'for (let i = 0; i < 3; i++) { console.log(i); }',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'for (let i = 0; i > 3; i++) { console.log(i); }',
          en: 'for (let i = 0; i > 3; i++) { console.log(i); }',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'let i = 0; while (i < 3) { console.log(i); i++; }',
          en: 'let i = 0; while (i < 3) { console.log(i); i++; }',
        },
      },
      {
        id: 'd',
        label: {
          fa: '[0, 1, 2].forEach((n) => console.log(n));',
          en: '[0, 1, 2].forEach((n) => console.log(n));',
        },
      },
    ],
    answer: 'b',
    points: 1,
  },
  {
    id: 'cs-04',
    domain: 'codeSense',
    type: 'multi_choice',
    prompt: {
      fa: 'دربارهٔ این حلقه کدام‌ها درست است؟\nfor (let i = 1; i <= 3; i++) { console.log(i); }',
      en: 'Which statements are true about this loop?\nfor (let i = 1; i <= 3; i++) { console.log(i); }',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'اعداد ۱، ۲ و ۳ چاپ می‌شوند',
          en: 'It prints 1, 2, and 3',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'حلقه دقیقاً سه بار بدنه را اجرا می‌کند',
          en: 'The loop body runs exactly three times',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'عدد ۰ حتماً چاپ می‌شود',
          en: 'It always prints 0',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'شرط توقف وقتی i به ۴ می‌رسد برقرار می‌شود (دیگر وارد بدنه نمی‌شود)',
          en: 'The loop stops when i becomes 4 (body no longer runs)',
        },
      },
    ],
    answer: ['a', 'b', 'd'],
    points: 1,
  },

  // ── problemSolving ──────────────────────────────────────────────────────
  {
    id: 'ps-01',
    domain: 'problemSolving',
    type: 'single_choice',
    prompt: {
      fa: 'داستان کاربر: «به‌عنوان یادگیرنده می‌خواهم پیشرفت درسم را ببینم.» اولین چیزی که باید ساخته شود کدام است؟',
      en: 'User story: “As a learner I want to see my lesson progress.” What should you build first?',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'یک انیمیشن سه‌بعدی پیچیده برای کل آکادمی',
          en: 'A complex 3D animation for the whole academy',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'نمایش سادهٔ درصد تکمیل یا تیک درس‌های تمام‌شده',
          en: 'A simple completed-lessons checklist or progress percent',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'سیستم پرداخت بین‌المللی کامل قبل از هر چیز',
          en: 'A full international payment system before anything else',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'حذف همهٔ درس‌ها از پایگاه‌داده',
          en: 'Deleting all lessons from the database',
        },
      },
    ],
    answer: 'b',
    points: 1,
  },
  {
    id: 'ps-02',
    domain: 'problemSolving',
    type: 'order',
    prompt: {
      fa: 'داستان کاربر ورود با شماره موبایل را به مراحل پیاده‌سازی درست مرتب کنید.',
      en: 'Order these implementation steps for a phone-login user story.',
    },
    orderItems: [
      {
        id: 'p3',
        label: {
          fa: 'پس از تأیید کد، جلسهٔ کاربر را ایجاد کنید',
          en: 'After code verification, create the user session',
        },
      },
      {
        id: 'p1',
        label: {
          fa: 'فرم دریافت شماره موبایل را طراحی و اعتبارسنجی کنید',
          en: 'Design and validate the phone-number input form',
        },
      },
      {
        id: 'p4',
        label: {
          fa: 'کاربر را به صفحهٔ بعدی جریان هدایت کنید',
          en: 'Redirect the user to the next step in the flow',
        },
      },
      {
        id: 'p2',
        label: {
          fa: 'ارسال و دریافت کد یک‌بارمصرف (OTP) را پیاده کنید',
          en: 'Implement sending and receiving the one-time code (OTP)',
        },
      },
    ],
    answer: ['p1', 'p2', 'p3', 'p4'],
    points: 1,
  },
  {
    id: 'ps-03',
    domain: 'problemSolving',
    type: 'multi_choice',
    prompt: {
      fa: 'برای ساخت یک فرم ثبت‌نام مینیمم قابل‌استفاده، کدام موارد را باید زودتر انجام دهید؟ (چند گزینه)',
      en: 'For a minimal usable signup form, which should you do early? (select all that apply)',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'فیلدهای ضروری و اعتبارسنجی پایه',
          en: 'Required fields and basic validation',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'پیام خطای واضح وقتی ورودی نامعتبر است',
          en: 'Clear error messages when input is invalid',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'تم کامل برندینگ قبل از اینکه فرم کار کند',
          en: 'Full brand theming before the form works at all',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'ارسال داده به سرور یا ذخیرهٔ موقت برای تست جریان',
          en: 'Submit to the server or a stub so you can test the flow',
        },
      },
    ],
    answer: ['a', 'b', 'd'],
    points: 1,
  },
  {
    id: 'ps-04',
    domain: 'problemSolving',
    type: 'single_choice',
    prompt: {
      fa: 'زمان محدود است. برای یک چک‌اوت ساده، بهترین اولویت کدام است؟',
      en: 'Time is limited. For a simple checkout, what is the best priority?',
    },
    options: [
      {
        id: 'a',
        label: {
          fa: 'اول جزئیات زیبایی‌شناختی نادر، بعد منطق پرداخت',
          en: 'Rare visual polish first, payment logic later',
        },
      },
      {
        id: 'b',
        label: {
          fa: 'اول نمایش مبلغ، تأیید سفارش، و مسیر پرداخت کارآمد',
          en: 'First: show amount, confirm order, and a working payment path',
        },
      },
      {
        id: 'c',
        label: {
          fa: 'فقط افزودن ده درگاه پرداخت بدون تست',
          en: 'Add ten payment gateways with no testing',
        },
      },
      {
        id: 'd',
        label: {
          fa: 'نادیده گرفتن کامل امنیت تراکنش',
          en: 'Ignore transaction security entirely',
        },
      },
    ],
    answer: 'b',
    points: 1,
  },
];
