import { escapeHtml } from '@kia-academy/shared';

export function markdownToHtml(markdown: string): string {
  const blocks: string[] = [];
  let remaining = markdown.trim();

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^```[\w]*\n([\s\S]*?)```/);
    if (codeMatch) {
      blocks.push(`<pre><code>${escapeHtml(codeMatch[1]!.trim())}</code></pre>`);
      remaining = remaining.slice(codeMatch[0].length).trimStart();
      continue;
    }

    const line = remaining.split('\n')[0] ?? '';
    if (line.startsWith('### ')) {
      blocks.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      blocks.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      blocks.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith('- ')) {
      const items: string[] = [];
      const lines = remaining.split('\n');
      let i = 0;
      while (i < lines.length && lines[i]!.startsWith('- ')) {
        items.push(`<li>${inlineFormat(lines[i]!.slice(2))}</li>`);
        i++;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      remaining = lines.slice(i).join('\n').trimStart();
      continue;
    } else if (line.trim()) {
      const paraLines: string[] = [];
      const lines = remaining.split('\n');
      let i = 0;
      while (
        i < lines.length &&
        lines[i]!.trim() &&
        !lines[i]!.startsWith('#') &&
        !lines[i]!.startsWith('- ')
      ) {
        paraLines.push(lines[i]!);
        i++;
      }
      blocks.push(`<p>${inlineFormat(paraLines.join(' '))}</p>`);
      remaining = lines.slice(i).join('\n').trimStart();
      continue;
    } else {
      remaining = remaining.slice(line.length + 1).trimStart();
      continue;
    }
    remaining = remaining.slice(line.length + 1).trimStart();
  }

  return `<div class="lesson-md">${blocks.join('')}</div>`;
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
