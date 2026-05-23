import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { EmailLoginDto } from '@/modules/auth/dto/email-login.dto';
import { GoogleLoginDto } from '@/modules/auth/dto/google-login.dto';
import { LogoutDto } from '@/modules/auth/dto/logout.dto';
import { PhoneRequestOtpDto } from '@/modules/auth/dto/phone-request-otp.dto';
import { PhoneVerifyOtpDto } from '@/modules/auth/dto/phone-verify-otp.dto';
import { RefreshTokenDto } from '@/modules/auth/dto/refresh-token.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/login')
  loginWithEmail(@Body() body: EmailLoginDto) {
    return this.authService.loginWithEmail(body);
  }

  @Post('phone/request-otp')
  requestPhoneOtp(@Body() body: PhoneRequestOtpDto) {
    return this.authService.requestPhoneOtp(body);
  }

  @Post('phone/verify-otp')
  verifyPhoneOtp(@Body() body: PhoneVerifyOtpDto) {
    return this.authService.verifyPhoneOtp(body);
  }

  @Post('google')
  loginWithGoogle(@Body() body: GoogleLoginDto) {
    return this.authService.loginWithGoogle(body);
  }

  @Post('refresh')
  refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }

  @Post('logout')
  logout(@Body() body: LogoutDto) {
    return this.authService.logout(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }
}
