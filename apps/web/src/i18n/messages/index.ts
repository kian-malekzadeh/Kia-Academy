import type { Locale } from '../locales';
import { en } from './en';
import { fa } from './fa';

/** Recursive string tree shaped like the English catalog. */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Messages = DeepStringify<typeof en>;

export { en } from './en';
export { fa } from './fa';

export const messages: Record<Locale, Messages> = {
  en: en as Messages,
  fa: fa as Messages,
};
