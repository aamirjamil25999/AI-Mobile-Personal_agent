import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Injectable,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import { AuthProvider, type User, type UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';
import type { CookieOptions } from 'express';
import { randomBytes } from 'crypto';

import { EnvService } from '@/config/env';
import { PrismaService } from '@/database/prisma.service';
import type { EmailLoginDto } from '@/modules/auth/dto/email-login.dto';
import type { EmailSignupDto } from '@/modules/auth/dto/email-signup.dto';
import type { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import type { GoogleLoginDto } from '@/modules/auth/dto/google-login.dto';
import type { PhoneRequestOtpDto } from '@/modules/auth/dto/phone-request-otp.dto';
import type { PhoneVerifyOtpDto } from '@/modules/auth/dto/phone-verify-otp.dto';
import type { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';

@Injectable()
export class AuthService {
  private static readonly OTP_EXPIRY_MS = 5 * 60 * 1000;
  private static readonly OTP_RESEND_COOLDOWN_MS = 30 * 1000;
  private static readonly OTP_MAX_ATTEMPTS = 5;

  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService
  ) {}

  async signupWithEmail(dto: EmailSignupDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw new ConflictException('Account already exists for this email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const fullName = dto.fullName?.trim() || normalizedEmail.split('@')[0];

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        provider: AuthProvider.EMAIL,
        fullName
      }
    });

    return this.issueAuthResponse(user);
  }

  async loginWithEmail(dto: EmailLoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Account is not configured for password login');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueAuthResponse(user);
  }

  async requestPhoneOtp(dto: PhoneRequestOtpDto) {
    const phoneNumber = dto.phoneNumber.trim();
    const now = new Date();

    const existing = await this.prisma.phoneOtp.findUnique({
      where: { phoneNumber }
    });

    if (
      existing &&
      existing.expiresAt.getTime() > now.getTime() &&
      now.getTime() - existing.updatedAt.getTime() < AuthService.OTP_RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Please wait before requesting a new OTP',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now.getTime() + AuthService.OTP_EXPIRY_MS);

    await this.prisma.phoneOtp.upsert({
      where: { phoneNumber },
      create: { phoneNumber, otpHash, expiresAt },
      update: { otpHash, expiresAt, attempts: 0 }
    });

    await this.dispatchOtp(phoneNumber, otp);

    return {
      message: 'OTP sent successfully',
      otp: this.env.exposeDevOtp ? otp : undefined
    };
  }

  async verifyPhoneOtp(dto: PhoneVerifyOtpDto) {
    const phoneNumber = dto.phoneNumber.trim();
    const record = await this.prisma.phoneOtp.findUnique({
      where: { phoneNumber }
    });

    if (!record) {
      throw new BadRequestException('OTP not requested');
    }

    if (record.attempts >= AuthService.OTP_MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many invalid OTP attempts, request a new OTP',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await this.prisma.phoneOtp.delete({ where: { phoneNumber } }).catch(() => {
        // Ignore race conditions where OTP record is already removed.
      });
      throw new BadRequestException('OTP expired');
    }

    const isValid = await bcrypt.compare(dto.otp, record.otpHash);
    if (!isValid) {
      const updated = await this.prisma.phoneOtp.update({
        where: { phoneNumber },
        data: { attempts: { increment: 1 } }
      });

      if (updated.attempts >= AuthService.OTP_MAX_ATTEMPTS) {
        throw new HttpException(
          'Too many invalid OTP attempts, request a new OTP',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      throw new UnauthorizedException('Invalid OTP');
    }

    const user =
      (await this.prisma.user.findUnique({ where: { phoneNumber } })) ??
      (await this.prisma.user.create({
        data: {
          phoneNumber,
          provider: AuthProvider.PHONE,
          fullName: `user_${phoneNumber.slice(-4)}`
        }
      }));

    await this.prisma.phoneOtp.delete({ where: { phoneNumber } });

    return this.issueAuthResponse(user);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const profile = await this.verifyGoogleIdToken(dto.idToken);

    if (!profile.email) {
      throw new BadRequestException('Google account email missing');
    }

    const email = profile.email.toLowerCase();

    const user =
      (await this.prisma.user.findUnique({ where: { email } })) ??
      (await this.prisma.user.create({
        data: {
          email,
          fullName: profile.name ?? email.split('@')[0],
          provider: AuthProvider.GOOGLE
        }
      }));

    return this.issueAuthResponse(user);
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    const genericResponse = {
      message: 'If this email exists, password reset instructions have been sent.'
    };

    if (!user) {
      return genericResponse;
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 10);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.env.passwordResetExpiryMs)
      }
    });

    this.logger.log(`Password reset token for ${email}: ${resetToken}`);

    return {
      ...genericResponse,
      resetToken: this.env.exposeDevOtp ? resetToken : undefined
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const activeTokens = await this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    let matchedTokenId: string | null = null;
    let matchedUserId: string | null = null;

    for (const token of activeTokens) {
      const isMatch = await bcrypt.compare(dto.token, token.tokenHash);
      if (isMatch) {
        matchedTokenId = token.id;
        matchedUserId = token.userId;
        break;
      }
    }

    if (!matchedTokenId || !matchedUserId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: matchedUserId },
        data: {
          passwordHash
        }
      }),
      this.prisma.passwordResetToken.update({
        where: { id: matchedTokenId },
        data: { usedAt: now }
      }),
      this.prisma.refreshSession.updateMany({
        where: {
          userId: matchedUserId,
          revokedAt: null
        },
        data: { revokedAt: now }
      })
    ]);

    return {
      message: 'Password reset successful. Please sign in again.'
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sid }
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh session invalid');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, session.tokenHash);
    if (!tokenMatch) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.createTokens(user.id, user.email, user.role);

    return tokens;
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return {
        message: 'Logged out successfully'
      };
    }

    let payload: { sub: string; sid: string };

    try {
      payload = await this.verifyRefreshToken(refreshToken);
    } catch {
      return {
        message: 'Logged out successfully'
      };
    }

    await this.prisma.refreshSession.updateMany({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    return {
      message: 'Logged out successfully'
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toSafeUser(user);
  }

  getRefreshCookieConfig(): { name: string; options: CookieOptions } {
    return {
      name: this.env.refreshCookieName,
      options: {
        httpOnly: true,
        secure: this.env.isProduction,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: this.env.refreshCookieMaxAgeMs,
        ...(this.env.cookieDomain ? { domain: this.env.cookieDomain } : {})
      }
    };
  }

  private async issueAuthResponse(user: User): Promise<{
    user: ReturnType<AuthService['toSafeUser']>;
    accessToken: string;
    refreshToken: string;
  }> {
    const tokens = await this.createTokens(user.id, user.email, user.role);

    return {
      user: this.toSafeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  private async createTokens(
    userId: string,
    email: string | null,
    role: UserRole
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: '',
        expiresAt: new Date(Date.now() + this.env.refreshCookieMaxAgeMs)
      }
    });

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.env.jwtAccessSecret,
        expiresIn: this.env.jwtAccessExpiresIn
      }
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, sid: session.id },
      {
        secret: this.env.jwtRefreshSecret,
        expiresIn: this.env.jwtRefreshExpiresIn
      }
    );

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        tokenHash: await bcrypt.hash(refreshToken, 10)
      }
    });

    return {
      accessToken,
      refreshToken
    };
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwt.verifyAsync<{ sub: string; sid: string }>(token, {
        secret: this.env.jwtRefreshSecret
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async verifyGoogleIdToken(idToken: string): Promise<{ email: string | null; name?: string }> {
    if (idToken.startsWith('dev-google-token:')) {
      const email = idToken.replace('dev-google-token:', '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        throw new BadRequestException('Invalid dev google token format');
      }
      return {
        email,
        name: email.split('@')[0]
      };
    }

    const audience = this.env.googleClientIds;

    if (audience.length === 0) {
      throw new BadRequestException('GOOGLE_CLIENT_IDS is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience
    });

    const payload = ticket.getPayload();

    return {
      email: payload?.email ?? null,
      name: payload?.name
    };
  }

  private async dispatchOtp(phoneNumber: string, otp: string) {
    if (this.env.otpProvider === 'TWILIO') {
      await this.sendOtpViaTwilio(phoneNumber, otp);
      return;
    }

    this.logger.log(`OTP for ${phoneNumber}: ${otp}`);
  }

  private async sendOtpViaTwilio(phoneNumber: string, otp: string) {
    const accountSid = this.env.twilioAccountSid;
    const authToken = this.env.twilioAuthToken;
    const fromNumber = this.env.twilioFromNumber;

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.error('Twilio OTP provider is enabled but credentials are missing.');
      throw new InternalServerErrorException('OTP provider is not configured');
    }

    const formattedTo = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const params = new URLSearchParams({
      To: formattedTo,
      From: fromNumber,
      Body: `Your My Phone Agent OTP is ${otp}. It expires in 5 minutes.`
    });

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    );

    if (!response.ok) {
      const reason = await response.text();
      this.logger.error(`Twilio OTP send failed (${response.status}): ${reason}`);
      throw new InternalServerErrorException('Failed to dispatch OTP');
    }
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      role: user.role,
      provider: user.provider
    };
  }
}
