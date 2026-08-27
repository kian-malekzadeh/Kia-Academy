import type { Messages } from './messages';
import { DEFAULT_LOCALE, type Locale } from './locales';

export type MessageParams = Record<string, string | number>;

type Primitive = string | number | boolean | null | undefined;

type MessageTree = {
  [key: string]: Primitive | MessageTree;
};

export type MessageKey = string;

function getNestedValue(tree: MessageTree, key: string): string | undefined {
  const parts = key.split('.');
  let current: Primitive | MessageTree | undefined = tree;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export function createTranslator(messages: Messages, fallback: Messages) {
  return function translate(key: MessageKey, params?: MessageParams): string {
    const primary = getNestedValue(messages as MessageTree, key);
    if (primary) return interpolate(primary, params);
    const backup = getNestedValue(fallback as MessageTree, key);
    if (backup) return interpolate(backup, params);
    return key;
  };
}

export function getMessagesForLocale(locale: Locale, catalog: Record<Locale, Messages>): Messages {
  return catalog[locale] ?? catalog[DEFAULT_LOCALE];
}
