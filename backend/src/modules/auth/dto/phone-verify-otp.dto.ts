import { IsString, Matches } from 'class-validator';

export class PhoneVerifyOtpDto {
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phoneNumber!: string;

  @IsString()
  @Matches(/^[0-9]{6}$/)
  otp!: string;
}
