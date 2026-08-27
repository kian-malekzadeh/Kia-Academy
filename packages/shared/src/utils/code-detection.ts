/**
 * Heuristic programming-code detector for support tickets / messages.
 * Tuned to avoid false positives on URLs, dates, order numbers, and normal punctuation.
 */

const CODE_FENCE = /```[\s\S]*?```/;
const INLINE_CODE_HEAVY = /`[^`\n]{12,}`/;

/** Language-ish constructs that rarely appear in normal support prose. */
const STRONG_PATTERNS: RegExp[] = [
  /\bimport\s+[\w*{}\s,]+\s+from\s+['"][^'"]+['"]/,
  /\bexport\s+(default\s+)?(async\s+)?(function|class|const|let|var)\b/,
  /\bpackage\s+[a-zA-Z_][\w.]*\s*;/,
  /\b#include\s*[<"][\w./]+[>"]/,
  /\bdef\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/,
  /\bfn\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*\{/,
  /\bfunction\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*\{/,
  /\bclass\s+[A-Z][A-Za-z0-9_]*\s*(\{|extends\b|implements\b)/,
  /=>\s*\{/,
  /<\/?(script|style|html|body|div|span|input|button)\b[^>]*>/i,
  /\bconsole\.(log|error|warn|debug)\s*\(/,
  /\bSystem\.out\.println\s*\(/,
  /\bpublic\s+static\s+void\s+main\s*\(/,
  /\bSELECT\s+.+\s+FROM\s+\w+/i,
  /\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i,
  /\$\{[^}]+\}/,
  /<%[\s\S]*?%>/,
];

const MODERATE_PATTERNS: RegExp[] = [
  /\b(const|let|var)\s+[a-zA-Z_]\w*\s*=/,
  /\b(if|for|while|switch)\s*\([^)]{2,}\)\s*\{/,
  /\breturn\s+[^;\n]{0,80};/,
  /[{};]\s*$/m,
  /\b\w+\.\w+\([^)]*\)\s*;/,
  /::\w+/,
  /->\w+/,
];

function stripUrls(text: string): string {
  return text
    .replace(/\bhttps?:\/\/[^\s]+/gi, ' ')
    .replace(/\bwww\.[^\s]+/gi, ' ');
}

function stripOrderLikeTokens(text: string): string {
  // Order / reference / tracking style tokens (ABC-12345, #48291, INV-2024-01)
  return text
    .replace(/#[A-Za-z0-9_-]{4,}/g, ' ')
    .replace(/\b[A-Z]{2,}-?\d{3,}(?:-\d+)*/g, ' ')
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, ' ');
}

export function containsProgrammingCode(value: string): boolean {
  const raw = String(value || '');
  if (!raw.trim()) return false;

  if (CODE_FENCE.test(raw) || INLINE_CODE_HEAVY.test(raw)) return true;

  const normalized = stripOrderLikeTokens(stripUrls(raw));

  let strongHits = 0;
  for (const pattern of STRONG_PATTERNS) {
    if (pattern.test(normalized)) strongHits += 1;
    if (strongHits >= 1) return true;
  }

  let moderateHits = 0;
  for (const pattern of MODERATE_PATTERNS) {
    if (pattern.test(normalized)) moderateHits += 1;
    if (moderateHits >= 2) return true;
  }

  // Dense brace/semicolon density typical of pasted source (not normal prose).
  const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 4) {
    const codeish = lines.filter((line) => /[{};]$/.test(line) || /[{}();=]{2,}/.test(line));
    if (codeish.length >= 3 && codeish.length / lines.length >= 0.5) return true;
  }

  return false;
}
