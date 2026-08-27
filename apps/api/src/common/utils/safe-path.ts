import { BadRequestException } from '@nestjs/common';
import { basename, resolve, sep } from 'path';

/**
 * Reject path segments that could escape an uploads root (traversal, absolute paths, separators).
 */
export function assertSafePathSegment(segment: string, label = 'path'): string {
  if (
    !segment ||
    segment !== basename(segment) ||
    segment.includes('\0') ||
    segment === '.' ||
    segment === '..'
  ) {
    throw new BadRequestException(`Invalid ${label}`);
  }
  return segment;
}

/**
 * Resolve `segments` under `root` and ensure the result stays inside that root.
 */
export function resolveUnderRoot(root: string, ...segments: string[]): string {
  const safe = segments.map((s, i) => assertSafePathSegment(s, `path segment ${i + 1}`));
  const rootResolved = resolve(root);
  const absolute = resolve(rootResolved, ...safe);
  const prefix = rootResolved.endsWith(sep) ? rootResolved : rootResolved + sep;
  if (absolute !== rootResolved && !absolute.startsWith(prefix)) {
    throw new BadRequestException('Invalid path');
  }
  return absolute;
}
