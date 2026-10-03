import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The horizontal gutter lives on `.container` (`padding-inline: var(--space-6)`).
 * Page shells that also carry `.container` add vertical rhythm, and the easiest
 * way to write that is the `padding` shorthand with `0` on the sides — which has
 * the same specificity as `.container` and lands later in the cascade, so it
 * wins and leaves the page flush against the column edge (this shipped once on
 * the course catalog, `/results`, `/cart`-style shells, the lesson studio, …).
 *
 * These tests pin the invariant structurally: the gutter must exist, and no
 * container-bearing shell may zero it.
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTAINER_TOKENS = new Set(['container', 'container-fluid', 'app']);
const ZERO = new Set(['0', '0px', '0rem']);

function walk(dir: string, extensions: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...walk(full, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

/** Classes that are ever rendered together with the gutter container. */
function containerCoClasses(): Set<string> {
  const coClasses = new Set<string>();
  for (const file of walk(SRC, ['.tsx', '.ts'])) {
    const src = readFileSync(file, 'utf8');
    // Group per `className` occurrence: one element's classes, not the file's.
    const perElement = [...src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)].map((match) => {
      const raw = match[1] ?? match[2] ?? '';
      return new Set(raw.match(/[A-Za-z_][\w-]*/g) ?? []);
    });
    for (const tokens of perElement) {
      if (![...tokens].some((token) => CONTAINER_TOKENS.has(token))) continue;
      for (const token of tokens) {
        if (!CONTAINER_TOKENS.has(token)) coClasses.add(token);
      }
    }
  }
  return coClasses;
}

type Rule = { prelude: string; body: string };

/** Flat CSS rule list (at-rules such as `@media` are unwrapped, prelude dropped). */
function cssRules(src: string): Rule[] {
  const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  let depth = 0;
  let prelude = '';
  let bodyStart = 0;
  for (let i = 0; i < withoutComments.length; i += 1) {
    const char = withoutComments[i];
    if (char === '{') {
      if (depth === 0) {
        prelude = withoutComments.slice(bodyStart, i);
        bodyStart = i + 1;
      }
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const head = prelude.trim();
        const body = withoutComments.slice(bodyStart, i);
        if (head.startsWith('@')) rules.push(...cssRules(`${body}{}`));
        else if (head && !head.includes('{')) rules.push({ prelude: head, body });
        bodyStart = i + 1;
      }
    }
  }
  return rules;
}

function declarations(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of body.split(';')) {
    const index = part.indexOf(':');
    if (index === -1) continue;
    map.set(part.slice(0, index).trim().toLowerCase(), part.slice(index + 1).trim());
  }
  return map;
}

/** Inline (left/right) components of a `padding` shorthand value. */
function shorthandInlineValues(value: string): string[] {
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts;
  if (parts.length === 2 || parts.length === 3) return [parts[1]];
  if (parts.length >= 4) return [parts[1], parts[3]];
  return [];
}

/** Last compound selector of one comma-separated selector (`.a .b` → `.b`). */
function lastCompound(selector: string): string {
  return selector.trim().split(/[\s>+~]+/).pop() ?? '';
}

describe('container gutter', () => {
  const coClasses = containerCoClasses();
  const sheets = walk(SRC, ['.css']);
  const rules = sheets.flatMap((file) =>
    cssRules(readFileSync(file, 'utf8')).map((rule) => ({
      file: path.relative(SRC, file),
      ...rule,
    })),
  );

  it('knows the container-bearing page shells it is guarding', () => {
    expect(coClasses.size).toBeGreaterThan(0);
    for (const known of ['catalog-shell', 'results', 'lesson-shell', 'cart-shell', 'auth-shell']) {
      expect([...coClasses]).toContain(known);
    }
  });

  it('keeps a non-zero horizontal gutter on .container', () => {
    const containerRule = rules.find(
      (rule) =>
        rule.prelude
          .split(',')
          .some((selector) => CONTAINER_TOKENS.has(lastCompound(selector).replace(/^\./, ''))),
    );
    expect(containerRule).toBeDefined();
    const decls = declarations(containerRule!.body);
    const inline = decls.get('padding-inline') ?? decls.get('padding') ?? '';
    expect(inline).not.toBe('');
    for (const value of shorthandInlineValues(inline)) {
      expect(ZERO.has(value.toLowerCase())).toBe(false);
    }
  });

  it('is never zeroed by a shell that also carries .container', () => {
    const offenders: string[] = [];
    for (const rule of rules) {
      const selectors = rule.prelude
        .split(',')
        .map((selector) => lastCompound(selector))
        .filter((compound) => coClasses.has(compound.replace(/^\./, '')));
      if (!selectors.length) continue;

      const decls = declarations(rule.body);
      const shorthand = decls.get('padding');
      if (shorthand && shorthandInlineValues(shorthand).some((value) => ZERO.has(value.toLowerCase()))) {
        offenders.push(`${rule.file} → ${rule.prelude.trim()} { padding: ${shorthand} }`);
      }
      for (const property of ['padding-inline', 'padding-left', 'padding-right']) {
        const value = decls.get(property);
        if (value && ZERO.has(value.toLowerCase())) {
          offenders.push(`${rule.file} → ${rule.prelude.trim()} { ${property}: ${value} }`);
        }
      }
    }

    expect(
      offenders,
      `Use padding-block (or an explicit non-zero padding-inline) so .container keeps its gutter:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
