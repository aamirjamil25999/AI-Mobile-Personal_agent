import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator';

class CreateExecutionAuditDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(280)
  detail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;
}

export class CreateExecutionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(24)
  actionId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  prompt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  safetyCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  targetPhoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  callStatus?: string;

  @IsOptional()
  @IsDateString()
  executedAt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExecutionAuditDto)
  audits?: CreateExecutionAuditDto[];
}
