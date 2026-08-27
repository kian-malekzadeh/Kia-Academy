import { describe, expect, it } from 'vitest';
import { containsProgrammingCode } from './code-detection';

describe('containsProgrammingCode', () => {
  it('detects common source snippets', () => {
    expect(containsProgrammingCode('function hello() { return 1; }')).toBe(true);
    expect(containsProgrammingCode('```js\nconst x = 1;\n```')).toBe(true);
    expect(
      containsProgrammingCode("import React from 'react';\nexport default function App() {}"),
    ).toBe(true);
    expect(containsProgrammingCode('<script>alert(1)</script>')).toBe(true);
    expect(containsProgrammingCode('SELECT id FROM users WHERE active = 1')).toBe(true);
  });

  it('allows normal support text, URLs, dates, and order numbers', () => {
    expect(containsProgrammingCode('سلام، دوره جاوااسکریپت من باز نمی‌شود.')).toBe(false);
    expect(
      containsProgrammingCode('Please check https://example.com/orders/123 and help me.'),
    ).toBe(false);
    expect(containsProgrammingCode('My order #48291 from 2024-08-01 failed.')).toBe(false);
    expect(containsProgrammingCode('Invoice INV-2024-0199 totaling 1,250,000 IRR')).toBe(false);
    expect(containsProgrammingCode('I tried steps 1) restart 2) clear cache 3) login again.')).toBe(
      false,
    );
  });
});
