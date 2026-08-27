import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './markdown';

describe('markdownToHtml', () => {
  it('renders indented • bullets as an unordered list (Persian course copy)', () => {
    const md = `مهم‌ترین کاربردهای آن عبارت‌اند از:
    • ساختاردهی به محتوای صفحات وب
    • ایجاد لینک بین صفحات (Hyperlinking)
    • ساخت فرم‌ها برای دریافت اطلاعات کاربر`;

    const html = markdownToHtml(md);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>ساختاردهی به محتوای صفحات وب</li>');
    // The first line is a paragraph; bullet lines must not be folded into it.
    expect(html).toMatch(
      /<p>.*کاربردهای آن عبارت.*<\/p><ul>/,
    );
  });

  it('renders indented numbered lists (1. 2. 3.)', () => {
    const md = `یک عنصر HTML از سه بخش تشکیل می‌شود:
 1. تگ شروع (Start Tag)
 2. محتوا (Content)
 3. تگ پایان (End Tag)`;

    const html = markdownToHtml(md);
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>تگ شروع (Start Tag)</li>');
    expect(html).toContain('<li>تگ پایان (End Tag)</li>');
  });

  it('keeps ordered vs unordered lists and nested inline formatting', () => {
    const md = `## Run the STAR loop
1. *Situation* — set the scene.
2. *Result* — quantify it.

## Tips
- Lead with impact
- Quantify results`;

    const html = markdownToHtml(md);
    expect(html).toContain('<h2>Run the STAR loop</h2>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<em>Situation</em>');
    expect(html.match(/<ul>/g)).toHaveLength(1);
  });

  it('renders blockquotes, inline code, links and bold', () => {
    const md = '> Tip: recruiters skim for ~90 seconds.\n\n' +
      'Use `90 seconds` per answer. See [Wikipedia](https://en.wikipedia.org) for **STAR**.';

    const html = markdownToHtml(md);
    expect(html).toContain('<blockquote>Tip: recruiters skim for ~90 seconds.</blockquote>');
    expect(html).toContain('<code>90 seconds</code>');
    expect(html).toContain('<strong>STAR</strong>');
    expect(html).toContain('<a href="https://en.wikipedia.org" target="_blank" rel="noopener noreferrer">Wikipedia</a>');
  });

  it('escapes user content (no raw HTML passthrough)', () => {
    const html = markdownToHtml(`<script>alert(1)</script>`);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});