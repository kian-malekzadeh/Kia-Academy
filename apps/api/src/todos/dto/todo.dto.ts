import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @Length(1, 200)
  title!: string;
}

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
