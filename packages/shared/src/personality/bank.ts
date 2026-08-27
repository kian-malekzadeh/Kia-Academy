import type { PersonalityItem } from './types';

/**
 * Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006) — 20-item short form of
 * Goldberg’s IPIP Big-Five factor markers. Public-domain IPIP items.
 *
 * Citation: Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006).
 * The Mini-IPIP scales: Tiny-yet-effective measures of the Big Five factors of
 * personality. Psychological Assessment, 18(2), 192–203.
 *
 * Response scale: 1 = Very Inaccurate … 5 = Very Accurate.
 * Reverse-keyed items are scored as (6 − response) before summing.
 */
export const MINI_IPIP_CITATION =
  'Donnellan et al. (2006). Mini-IPIP — IPIP Big-Five short form.';

export const MINI_IPIP_ITEMS: readonly PersonalityItem[] = [
  {
    id: 'mipip-01',
    order: 1,
    trait: 'extraversion',
    reverse: false,
    textEn: 'Am the life of the party.',
    textFa: 'در مهمانی‌ها مرکز توجهم.',
  },
  {
    id: 'mipip-02',
    order: 2,
    trait: 'agreeableness',
    reverse: false,
    textEn: "Sympathize with others' feelings.",
    textFa: 'با احساسات دیگران همدردی می‌کنم.',
  },
  {
    id: 'mipip-03',
    order: 3,
    trait: 'conscientiousness',
    reverse: false,
    textEn: 'Get chores done right away.',
    textFa: 'کارها را فوراً انجام می‌دهم.',
  },
  {
    id: 'mipip-04',
    order: 4,
    trait: 'neuroticism',
    reverse: false,
    textEn: 'Have frequent mood swings.',
    textFa: 'خلق‌وخویم زیاد بالا و پایین می‌شود.',
  },
  {
    id: 'mipip-05',
    order: 5,
    trait: 'openness',
    reverse: false,
    textEn: 'Have a vivid imagination.',
    textFa: 'تخیل زنده‌ای دارم.',
  },
  {
    id: 'mipip-06',
    order: 6,
    trait: 'extraversion',
    reverse: true,
    textEn: "Don't talk a lot.",
    textFa: 'زیاد حرف نمی‌زنم.',
  },
  {
    id: 'mipip-07',
    order: 7,
    trait: 'agreeableness',
    reverse: true,
    textEn: "Am not interested in other people's problems.",
    textFa: 'به مشکلات دیگران علاقه‌ای ندارم.',
  },
  {
    id: 'mipip-08',
    order: 8,
    trait: 'conscientiousness',
    reverse: true,
    textEn: 'Often forget to put things back in their proper place.',
    textFa: 'اغلب فراموش می‌کنم وسایل را سر جایشان بگذارم.',
  },
  {
    id: 'mipip-09',
    order: 9,
    trait: 'neuroticism',
    reverse: true,
    textEn: 'Am relaxed most of the time.',
    textFa: 'بیشتر اوقات آرامم.',
  },
  {
    id: 'mipip-10',
    order: 10,
    trait: 'openness',
    reverse: true,
    textEn: 'Am not interested in abstract ideas.',
    textFa: 'به ایده‌های انتزاعی علاقه‌ای ندارم.',
  },
  {
    id: 'mipip-11',
    order: 11,
    trait: 'extraversion',
    reverse: false,
    textEn: 'Talk to a lot of different people at parties.',
    textFa: 'در مهمانی‌ها با افراد زیادی گفتگو می‌کنم.',
  },
  {
    id: 'mipip-12',
    order: 12,
    trait: 'agreeableness',
    reverse: false,
    textEn: "Feel others' emotions.",
    textFa: 'احساسات دیگران را حس می‌کنم.',
  },
  {
    id: 'mipip-13',
    order: 13,
    trait: 'conscientiousness',
    reverse: false,
    textEn: 'Like order.',
    textFa: 'نظم را دوست دارم.',
  },
  {
    id: 'mipip-14',
    order: 14,
    trait: 'neuroticism',
    reverse: false,
    textEn: 'Get upset easily.',
    textFa: 'به‌راحتی ناراحت می‌شوم.',
  },
  {
    id: 'mipip-15',
    order: 15,
    trait: 'openness',
    reverse: true,
    textEn: 'Have difficulty understanding abstract ideas.',
    textFa: 'درک ایده‌های انتزاعی برایم سخت است.',
  },
  {
    id: 'mipip-16',
    order: 16,
    trait: 'extraversion',
    reverse: true,
    textEn: 'Keep in the background.',
    textFa: 'ترجیح می‌دهم در حاشیه بمانم.',
  },
  {
    id: 'mipip-17',
    order: 17,
    trait: 'agreeableness',
    reverse: true,
    textEn: 'Am not really interested in others.',
    textFa: 'واقعاً به دیگران علاقه‌ای ندارم.',
  },
  {
    id: 'mipip-18',
    order: 18,
    trait: 'conscientiousness',
    reverse: true,
    textEn: 'Make a mess of things.',
    textFa: 'کارها را به‌هم می‌ریزم.',
  },
  {
    id: 'mipip-19',
    order: 19,
    trait: 'neuroticism',
    reverse: true,
    textEn: 'Seldom feel blue.',
    textFa: 'به‌ندرت غمگین می‌شوم.',
  },
  {
    id: 'mipip-20',
    order: 20,
    trait: 'openness',
    reverse: true,
    textEn: 'Do not have a good imagination.',
    textFa: 'تخیل قوی‌ای ندارم.',
  },
] as const;

export const MINI_IPIP_ITEM_IDS = MINI_IPIP_ITEMS.map((item) => item.id);
