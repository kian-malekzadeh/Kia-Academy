import { sniffImageMime } from './image-sniff';

describe('sniffImageMime', () => {
  const jpeg = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.alloc(16, 0x00),
  ]);
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(16, 0x00),
  ]);
  const gif = Buffer.concat([Buffer.from('GIF89a', 'latin1'), Buffer.alloc(16, 0x00)]);
  const webp = Buffer.concat([
    Buffer.from('RIFF', 'latin1'),
    Buffer.from([0x24, 0x08, 0x00, 0x00]),
    Buffer.from('WEBP', 'latin1'),
    Buffer.alloc(8, 0x00),
  ]);

  it('detects real image signatures from magic bytes', () => {
    expect(sniffImageMime(jpeg)).toBe('image/jpeg');
    expect(sniffImageMime(png)).toBe('image/png');
    expect(sniffImageMime(gif)).toBe('image/gif');
    expect(sniffImageMime(webp)).toBe('image/webp');
  });

  it('rejects non-image payloads such as scripts or HTML polyglots', () => {
    expect(sniffImageMime(Buffer.from('<script>alert(1)</script>'))).toBeNull();
    expect(sniffImageMime(Buffer.from('%PDF-1.4 malicious'))).toBeNull();
    expect(sniffImageMime(Buffer.from('<?php echo "pwn"; ?>'))).toBeNull();
  });

  it('rejects truncated buffers and empty input', () => {
    expect(sniffImageMime(Buffer.from([0xff]))).toBeNull();
    expect(sniffImageMime(Buffer.alloc(0))).toBeNull();
    expect(sniffImageMime(undefined)).toBeNull();
    expect(sniffImageMime(null)).toBeNull();
  });
});
