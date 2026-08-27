/** Default midterm/final question banks — the seed and the web demo both use these. */
import type { CourseExamQuestion } from '../types/course-exam';

export interface DefaultExamBank {
  midterm: CourseExamQuestion[];
  final: CourseExamQuestion[];
}

export const defaultExamBanks: Record<string, DefaultExamBank> = {
  html: {
    midterm: [
      {
        id: 'htm-m1', type: 'single_choice',
        prompt: 'HTML مخفف چیست؟',
        options: [
          { id: 'a', label: 'HighText Machine Language' },
          { id: 'b', label: 'HyperText Markup Language' },
          { id: 'c', label: 'Hyperlink Text Management Language' },
          { id: 'd', label: 'Home Tool Markup Language' },
        ],
        answer: 'b',
      },
      {
        id: 'htm-m2', type: 'single_choice',
        prompt: 'کدام تگ بزرگ‌ترین عنوان صفحه را نمایش می‌دهد؟',
        options: [
          { id: 'a', label: '<h6>' },
          { id: 'b', label: '<head>' },
          { id: 'c', label: '<h1>' },
          { id: 'd', label: '<header>' },
        ],
        answer: 'c',
      },
      {
        id: 'htm-m3', type: 'multi_choice',
        prompt: 'کدام‌ها تگ‌های ساختاری HTML هستند؟',
        options: [
          { id: 'a', label: '<header>' },
          { id: 'b', label: '<nav>' },
          { id: 'c', label: '<img>' },
          { id: 'd', label: '<footer>' },
        ],
        answer: ['a', 'b', 'd'],
      },
    ],
    final: [
      {
        id: 'htm-f1', type: 'single_choice',
        prompt: 'کدام تگ برای نمایش تصویر استفاده می‌شود؟',
        options: [
          { id: 'a', label: '<image>' },
          { id: 'b', label: '<img>' },
          { id: 'c', label: '<pic>' },
          { id: 'd', label: '<figure-src>' },
        ],
        answer: 'b',
      },
      {
        id: 'htm-f2', type: 'single_choice',
        prompt: 'ویژگی alt در تگ <img> چه کاربردی دارد؟',
        options: [
          { id: 'a', label: 'متن جایگزین تصویر' },
          { id: 'b', label: 'تعیین اندازه تصویر' },
          { id: 'c', label: 'باز کردن تصویر در تب جدید' },
          { id: 'd', label: 'فشرده‌سازی تصویر' },
        ],
        answer: 'a',
      },
      {
        id: 'htm-f3', type: 'multi_choice',
        prompt: 'کدام‌ها از عناصر فرم در HTML هستند؟',
        options: [
          { id: 'a', label: '<input>' },
          { id: 'b', label: '<select>' },
          { id: 'c', label: '<listbox>' },
          { id: 'd', label: '<textarea>' },
        ],
        answer: ['a', 'b', 'd'],
      },
    ],
  },
  css: {
    midterm: [
      {
        id: 'css-m1', type: 'single_choice',
        prompt: 'کدام ویژگی رنگ متن را تغییر می‌دهد؟',
        options: [
          { id: 'a', label: 'text-color' },
          { id: 'b', label: 'font-color' },
          { id: 'c', label: 'color' },
          { id: 'd', label: 'foreground' },
        ],
        answer: 'c',
      },
      {
        id: 'css-m2', type: 'single_choice',
        prompt: 'انتخابگر کلاس در CSS با چه علامتی نوشته می‌شود؟',
        options: [
          { id: 'a', label: '# (هش)' },
          { id: 'b', label: '. (نقطه)' },
          { id: 'c', label: '@ (ات)' },
          { id: 'd', label: '& (امپرسند)' },
        ],
        answer: 'b',
      },
      {
        id: 'css-m3', type: 'multi_choice',
        prompt: 'کدام‌ها واحدهای اندازه‌گیری در CSS هستند؟',
        options: [
          { id: 'a', label: 'px' },
          { id: 'b', label: 'rem' },
          { id: 'c', label: 'vw' },
          { id: 'd', label: 'scale' },
        ],
        answer: ['a', 'b', 'c'],
      },
    ],
    final: [
      {
        id: 'css-f1', type: 'single_choice',
        prompt: 'کدام ویژگی فاصله داخلی عنصر را تعیین می‌کند؟',
        options: [
          { id: 'a', label: 'margin' },
          { id: 'b', label: 'padding' },
          { id: 'c', label: 'gap' },
          { id: 'd', label: 'spacing' },
        ],
        answer: 'b',
      },
      {
        id: 'css-f2', type: 'single_choice',
        prompt: 'کدام دستور Flexbox را فعال می‌کند؟',
        options: [
          { id: 'a', label: 'display: flex;' },
          { id: 'b', label: 'position: flex;' },
          { id: 'c', label: 'layout: flex;' },
          { id: 'd', label: 'flex: on;' },
        ],
        answer: 'a',
      },
      {
        id: 'css-f3', type: 'multi_choice',
        prompt: 'کدام‌ها از مقادیر ویژگی position در CSS هستند؟',
        options: [
          { id: 'a', label: 'relative' },
          { id: 'b', label: 'absolute' },
          { id: 'c', label: 'center' },
          { id: 'd', label: 'fixed' },
        ],
        answer: ['a', 'b', 'd'],
      },
    ],
  },
  javascript: {
    midterm: [
      {
        id: 'js-m1', type: 'single_choice',
        prompt: 'کدام گزینه برای اعلان یک ثابت در جاوااسکریپت درست است؟',
        options: [
          { id: 'a', label: 'let x = 5;' },
          { id: 'b', label: 'const x = 5;' },
          { id: 'c', label: 'var const x = 5;' },
          { id: 'd', label: 'fixed x = 5;' },
        ],
        answer: 'b',
      },
      {
        id: 'js-m2', type: 'single_choice',
        prompt: 'نتیجهٔ عبارت typeof "سلام" چیست؟',
        options: [
          { id: 'a', label: 'text' },
          { id: 'b', label: 'char' },
          { id: 'c', label: 'string' },
          { id: 'd', label: 'undefined' },
        ],
        answer: 'c',
      },
      {
        id: 'js-m3', type: 'multi_choice',
        prompt: 'کدام‌ها نوع دادهٔ اولیه (primitive) در جاوااسکریپت هستند؟',
        options: [
          { id: 'a', label: 'number' },
          { id: 'b', label: 'boolean' },
          { id: 'c', label: 'object' },
          { id: 'd', label: 'symbol' },
        ],
        answer: ['a', 'b', 'd'],
      },
    ],
    final: [
      {
        id: 'js-f1', type: 'single_choice',
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
        id: 'js-f2', type: 'single_choice',
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
        id: 'js-f3', type: 'multi_choice',
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
        id: 'js-f4', type: 'single_choice',
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
        id: 'js-f5', type: 'multi_choice',
        prompt: 'کدام‌ها روش‌های انتخاب عنصر در DOM هستند؟',
        options: [
          { id: 'a', label: 'document.querySelector' },
          { id: 'b', label: 'document.createElement' },
          { id: 'c', label: 'element.addEventListener' },
          { id: 'd', label: 'document.getElementById' },
        ],
        answer: ['a', 'd'],
      },
    ],
  },
};

/** Fallback questions for courses without a dedicated bank (admin should replace them). */
export function genericExamQuestions(courseTitle: string): CourseExamQuestion[] {
  return [
    {
      id: 'gen-1',
      type: 'single_choice',
      prompt: `آزمون دورهٔ «${courseTitle}» به‌صورت پیش‌فرض ساخته شده است. وضعیت فعلی آن چیست؟`,
      options: [
        { id: 'a', label: 'پیش‌فرض — سؤالات آن باید در پنل مدیریت تکمیل شود' },
        { id: 'b', label: 'نهایی‌شده و بدون نیاز به تغییر' },
      ],
      answer: 'a',
    },
  ];
}

