import { IsString, MinLength } from 'class-validator';
import type { ChallengeSubmissionDto } from '@kia-academy/shared';

export class CreateChallengeSubmissionDto implements ChallengeSubmissionDto {
  @IsString()
  @MinLength(1)
  code!: string;
}
