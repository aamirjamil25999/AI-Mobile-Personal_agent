import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class PhoneVerifyOtpDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[^\d]/g, '').trim() : value
  )
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phoneNumber!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[^\d]/g, '').trim() : value
  )
  @IsString()
  @Matches(/^[0-9]{6}$/)
  otp!: string;
}
