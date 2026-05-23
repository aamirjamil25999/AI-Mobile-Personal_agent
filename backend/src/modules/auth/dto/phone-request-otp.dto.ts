import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class PhoneRequestOtpDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[^\d]/g, '').trim() : value
  )
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phoneNumber!: string;
}
