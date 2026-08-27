import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SiteAdminAccessDto,
} from '../../site-settings/dto/update-site-settings.dto';

export class AdminCreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['LEARNER', 'ADMIN', 'SUPER_ADMIN'])
  role?: 'LEARNER' | 'ADMIN' | 'SUPER_ADMIN';
}

export class AdminCreateLessonDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class AdminCreateCourseDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  trackKey?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminCreateLessonDto)
  lessons?: AdminCreateLessonDto[];
}

export class AdminUpdateCourseDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  trackKey?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class AdminCreateChallengeDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  starterCode?: string;
}

export class AdminUpdateChallengeDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  starterCode?: string;
}

export class AdminUpdateUserRoleDto {
  @IsString()
  role!: 'LEARNER' | 'ADMIN' | 'SUPER_ADMIN';
}

export class AdminUpdateUserAccessDto {
  @ValidateNested()
  @Type(() => SiteAdminAccessDto)
  adminPanelAccess!: SiteAdminAccessDto;
}

export class AdminUpdateLessonDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
