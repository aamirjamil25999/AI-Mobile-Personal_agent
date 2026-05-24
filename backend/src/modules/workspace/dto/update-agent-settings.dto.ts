import { IsBoolean, IsInt, IsObject, IsOptional, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AgentPluginsDto {
  @IsOptional()
  @IsBoolean()
  smartCall?: boolean;

  @IsOptional()
  @IsBoolean()
  messageDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  emailComposer?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSummaryLogs?: boolean;
}

export class AgentSafetyDto {
  @IsOptional()
  @IsBoolean()
  confirmSensitiveAction?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  dailyAutomationLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  auditRetentionDays?: number;
}

export class UpdateAgentSettingsDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgentPluginsDto)
  plugins?: AgentPluginsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgentSafetyDto)
  safety?: AgentSafetyDto;
}
