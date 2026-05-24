import { IsIn } from 'class-validator';

const FOLLOWUP_STATUS_VALUES = ['pending', 'done'] as const;

export class UpdateFollowUpStatusDto {
  @IsIn(FOLLOWUP_STATUS_VALUES)
  status!: (typeof FOLLOWUP_STATUS_VALUES)[number];
}
