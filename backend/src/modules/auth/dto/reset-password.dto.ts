import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(STRONG_PASSWORD_REGEX, {
    message:
      'Password must include uppercase, lowercase, number, and special character'
  })
  password!: string;
}
