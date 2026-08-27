/** Shared ticket attachment limits and allowlists (client + server). */

export const MAX_TICKET_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_TICKET_ATTACHMENTS = 5;

export const TICKET_ATTACHMENT_ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.rtf',
] as const;

export const TICKET_ATTACHMENT_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/rtf',
  'text/rtf',
] as const;

export const TICKET_ATTACHMENT_BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.msi',
  '.scr',
  '.ps1',
  '.sh',
  '.bash',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.php',
  '.py',
  '.rb',
  '.jar',
  '.dll',
  '.so',
  '.dmg',
  '.apk',
  '.ipa',
  '.vbs',
  '.wsf',
  '.hta',
  '.html',
  '.htm',
  '.svg',
] as const;

export interface TicketAttachmentMeta {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export function getFileExtension(fileName: string): string {
  const base = String(fileName || '').trim().toLowerCase();
  const idx = base.lastIndexOf('.');
  if (idx < 0) return '';
  return base.slice(idx);
}

export function isAllowedTicketAttachment(fileName: string, mimeType?: string): boolean {
  const ext = getFileExtension(fileName);
  if (!ext) return false;
  if ((TICKET_ATTACHMENT_BLOCKED_EXTENSIONS as readonly string[]).includes(ext)) return false;
  if (!(TICKET_ATTACHMENT_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) return false;
  if (mimeType) {
    const mime = mimeType.toLowerCase().split(';')[0]!.trim();
    // Some browsers send application/octet-stream; allow when extension is trusted.
    if (mime && mime !== 'application/octet-stream') {
      if (!(TICKET_ATTACHMENT_ALLOWED_MIME as readonly string[]).includes(mime)) return false;
    }
  }
  return true;
}

export function formatFileSize(bytes: number): string {
  const size = Math.max(0, Number(bytes) || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
