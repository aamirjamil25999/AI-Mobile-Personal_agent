import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FollowUpTemplateQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(24)
  actionId?: string;
}
