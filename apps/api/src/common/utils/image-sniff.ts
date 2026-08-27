/**
 * Detect an image's true MIME type from magic bytes (RFC 2046 "sniffing").
 * Returns null when the buffer does not match any supported image signature.
 */
export function sniffImageMime(buffer: Buffer | undefined | null): string | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // GIF87a / GIF89a
  const ascii6 = buffer.subarray(0, 6).toString('latin1');
  if (ascii6 === 'GIF87a' || ascii6 === 'GIF89a') return 'image/gif';
  // WebP: RIFF ???? WEBP
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
      buffer.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp';
  }
  return null;
}