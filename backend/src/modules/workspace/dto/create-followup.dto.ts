import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFollowUpDto {
  @IsOptional()
  @IsString()
  runId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(24)
  actionId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(140)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(600)
  note!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(24)
  channel!: string;

  @IsDateString()
  dueAt!: string;
}
