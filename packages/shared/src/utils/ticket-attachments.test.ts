import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  isAllowedTicketAttachment,
  MAX_TICKET_ATTACHMENT_BYTES,
} from './ticket-attachments';

describe('ticket attachment helpers', () => {
  it('allows common image and document types', () => {
    expect(isAllowedTicketAttachment('shot.png', 'image/png')).toBe(true);
    expect(isAllowedTicketAttachment('doc.pdf', 'application/pdf')).toBe(true);
    expect(isAllowedTicketAttachment('notes.txt', 'text/plain')).toBe(true);
  });

  it('rejects dangerous executables even with spoofed mime', () => {
    expect(isAllowedTicketAttachment('payload.exe', 'application/pdf')).toBe(false);
    expect(isAllowedTicketAttachment('run.sh', 'text/plain')).toBe(false);
    expect(isAllowedTicketAttachment('page.html', 'text/html')).toBe(false);
  });

  it('formats sizes and exposes a reasonable max', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(MAX_TICKET_ATTACHMENT_BYTES).toBe(5 * 1024 * 1024);
  });
});
