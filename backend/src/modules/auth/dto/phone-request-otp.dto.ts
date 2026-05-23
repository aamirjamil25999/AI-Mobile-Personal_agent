import { IsString, Matches } from 'class-validator';

export class PhoneRequestOtpDto {
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phoneNumber!: string;
}
