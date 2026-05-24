import { IsIn, IsOptional } from 'class-validator';

const FOLLOWUP_FILTER_VALUES = ['all', 'pending', 'done'] as const;

export class ListFollowUpsQueryDto {
  @IsOptional()
  @IsIn(FOLLOWUP_FILTER_VALUES)
  status?: (typeof FOLLOWUP_FILTER_VALUES)[number];
}
