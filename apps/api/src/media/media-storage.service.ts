import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import { assertSafePathSegment, resolveUnderRoot } from '../common/utils/safe-path';

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-m4v',
]);

const ALLOWED_EXT = new Set(['.mp4', '.webm', '.ogg', '.mov', '.m4v']);

/** Max upload size: 200 MB */
export const MAX_LESSON_VIDEO_BYTES = 200 * 1024 * 1024;

@Injectable()
export class MediaStorageService {
  readonly uploadsRoot = join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDir(this.uploadsRoot);
    this.ensureDir(join(this.uploadsRoot, 'lessons'));
  }

  assertVideoFile(file: Express.Multer.File | undefined): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    const ext = extname(file.originalname).toLowerCase();
    // Require both a known extension and a matching MIME type.
    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported video type. Allowed: mp4, webm, ogg, mov, m4v',
      );
    }
    if (file.size > MAX_LESSON_VIDEO_BYTES) {
      throw new BadRequestException('Video must be 200 MB or smaller');
    }
  }

  saveLessonVideo(lessonId: string, file: Express.Multer.File): string {
    assertSafePathSegment(lessonId, 'lesson id');
    this.assertVideoFile(file);
    const dir = resolveUnderRoot(this.uploadsRoot, 'lessons', lessonId);
    this.ensureDir(dir);

    // Replace any previous files for this lesson.
    this.clearLessonDir(lessonId);

    const ext = this.resolveExt(file);
    const filename = `video-${randomUUID()}${ext}`;
    writeFileSync(join(dir, filename), file.buffer);
    return `/api/uploads/lessons/${lessonId}/${filename}`;
  }

  deleteByPublicUrl(publicUrl: string | null | undefined): void {
    if (!publicUrl || !publicUrl.startsWith('/api/uploads/')) return;
    const relative = publicUrl.replace('/api/uploads/', '');
    const parts = relative.split(/[/\\]/).filter(Boolean);
    if (!parts.length || parts.some((p) => p === '..' || p !== basename(p))) return;
    try {
      const absolute = resolveUnderRoot(this.uploadsRoot, ...parts);
      if (existsSync(absolute)) {
        unlinkSync(absolute);
      }
    } catch {
      /* ignore invalid / missing paths */
    }
  }

  clearLessonDir(lessonId: string): void {
    assertSafePathSegment(lessonId, 'lesson id');
    const dir = resolveUnderRoot(this.uploadsRoot, 'lessons', lessonId);
    if (!existsSync(dir)) return;
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    this.ensureDir(dir);
  }

  private resolveExt(file: Express.Multer.File): string {
    const fromName = extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.has(fromName)) return fromName;
    switch (file.mimetype) {
      case 'video/webm':
        return '.webm';
      case 'video/ogg':
        return '.ogg';
      case 'video/quicktime':
        return '.mov';
      case 'video/x-m4v':
        return '.m4v';
      default:
        return '.mp4';
    }
  }

  private ensureDir(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /** Used by tests / diagnostics. */
  listLessonFiles(lessonId: string): string[] {
    assertSafePathSegment(lessonId, 'lesson id');
    const dir = resolveUnderRoot(this.uploadsRoot, 'lessons', lessonId);
    if (!existsSync(dir)) return [];
    return readdirSync(dir);
  }
}
