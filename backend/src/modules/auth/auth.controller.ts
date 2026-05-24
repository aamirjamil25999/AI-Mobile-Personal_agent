import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { EmailLoginDto } from '@/modules/auth/dto/email-login.dto';
import { EmailSignupDto } from '@/modules/auth/dto/email-signup.dto';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { GoogleLoginDto } from '@/modules/auth/dto/google-login.dto';
import { PhoneRequestOtpDto } from '@/modules/auth/dto/phone-request-otp.dto';
import { PhoneVerifyOtpDto } from '@/modules/auth/dto/phone-verify-otp.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email/signup')
  async signupWithEmail(
    @Body() body: EmailSignupDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const auth = await this.authService.signupWithEmail(body);
    this.setRefreshCookie(response, auth.refreshToken);

    return {
      user: auth.user,
      accessToken: auth.accessToken
    };
  }

  @Post('email/login')
  async loginWithEmail(
    @Body() body: EmailLoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const auth = await this.authService.loginWithEmail(body);
    this.setRefreshCookie(response, auth.refreshToken);

    return {
      user: auth.user,
      accessToken: auth.accessToken
    };
  }

  @Post('phone/request-otp')
  requestPhoneOtp(@Body() body: PhoneRequestOtpDto) {
    return this.authService.requestPhoneOtp(body);
  }

  @Post('phone/verify-otp')
  async verifyPhoneOtp(
    @Body() body: PhoneVerifyOtpDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const auth = await this.authService.verifyPhoneOtp(body);
    this.setRefreshCookie(response, auth.refreshToken);

    return {
      user: auth.user,
      accessToken: auth.accessToken
    };
  }

  @Post('google')
  async loginWithGoogle(
    @Body() body: GoogleLoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const auth = await this.authService.loginWithGoogle(body);
    this.setRefreshCookie(response, auth.refreshToken);

    return {
      user: auth.user,
      accessToken: auth.accessToken
    };
  }

  @Post('password/forgot')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body);
  }

  @Post('password/reset')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('refresh')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = this.readRefreshCookie(request, true);
    const tokens = await this.authService.refreshToken(refreshToken);
    this.setRefreshCookie(response, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken
    };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = this.readRefreshCookie(request, false);
    await this.authService.logout(refreshToken);
    this.clearRefreshCookie(response);

    return {
      message: 'Logged out successfully'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  private readRefreshCookie(request: Request, required: true): string;
  private readRefreshCookie(request: Request, required?: false): string | undefined;
  private readRefreshCookie(request: Request, required = true) {
    const config = this.authService.getRefreshCookieConfig();
    const refreshToken = (request.cookies?.[config.name] as string | undefined) ?? null;

    if (!refreshToken && required) {
      throw new UnauthorizedException('Refresh token cookie missing');
    }

    return refreshToken ?? undefined;
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    const config = this.authService.getRefreshCookieConfig();
    response.cookie(config.name, refreshToken, config.options);
  }

  private clearRefreshCookie(response: Response) {
    const config = this.authService.getRefreshCookieConfig();
    const clearOptions = { ...config.options };
    delete clearOptions.maxAge;
    response.clearCookie(config.name, clearOptions);
  }
}
