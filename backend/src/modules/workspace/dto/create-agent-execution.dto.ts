import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const EXECUTION_ACTIONS = ['call', 'message', 'email', 'settings'] as const;

export class CreateAgentExecutionDto {
  @IsIn(EXECUTION_ACTIONS)
  actionId!: (typeof EXECUTION_ACTIONS)[number];

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
}
