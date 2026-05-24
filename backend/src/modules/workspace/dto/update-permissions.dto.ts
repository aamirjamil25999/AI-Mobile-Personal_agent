import { IsIn, IsOptional } from 'class-validator';

const PERMISSION_VALUES = ['granted', 'denied', 'undetermined', 'unavailable'] as const;

export class UpdatePermissionsDto {
  @IsOptional()
  @IsIn(PERMISSION_VALUES)
  contactsPermission?: (typeof PERMISSION_VALUES)[number];

  @IsOptional()
  @IsIn(PERMISSION_VALUES)
  callPermission?: (typeof PERMISSION_VALUES)[number];
}
