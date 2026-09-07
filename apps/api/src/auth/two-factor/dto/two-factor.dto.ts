import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class TwoFactorCodeDto {
  /** 6-digit TOTP, or a 10-char recovery code (separators allowed). */
  @IsString()
  @MinLength(6)
  @MaxLength(16)
  code!: string;
}

export class TwoFactorChallengeDto {
  @IsString()
  @MinLength(20)
  @MaxLength(1024)
  challenge!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(16)
  @Matches(/^[\w-]+$/, {
    message: 'Code contains invalid characters',
  })
  code!: string;
}
