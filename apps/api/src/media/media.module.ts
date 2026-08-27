import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaStorageService } from './media-storage.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [MediaController],
  providers: [MediaStorageService, MediaService],
  exports: [MediaStorageService, MediaService],
})
export class MediaModule {}
