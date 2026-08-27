import { Controller, Get, Param, Query, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('lessons/:lessonId/:filename')
  async streamLessonVideo(
    @Param('lessonId') lessonId: string,
    @Param('filename') filename: string,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (!token) {
      throw new UnauthorizedException('Video token required');
    }
    await this.mediaService.streamLessonVideoWithToken(lessonId, filename, token, res);
  }
}
