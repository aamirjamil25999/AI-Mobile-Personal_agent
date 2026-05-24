import { Injectable } from '@nestjs/common';

export type OtpProvider = 'DEV_LOG' | 'TWILIO';

@Injectable()
export class EnvService {
  get nodeEnv() {
    return process.env.NODE_ENV ?? 'development';
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get port() {
    return Number(process.env.PORT ?? 3000);
  }

  get dbUrl() {
    const value = process.env.DATABASE_URL;
    if (!value) {
      throw new Error('DATABASE_URL is required');
    }
    return value;
  }

  get jwtAccessSecret() {
    const value = process.env.JWT_ACCESS_SECRET;
    if (!value) {
      throw new Error('JWT_ACCESS_SECRET is required');
    }
    return value;
  }

  get jwtRefreshSecret() {
    const value = process.env.JWT_REFRESH_SECRET;
    if (!value) {
      throw new Error('JWT_REFRESH_SECRET is required');
    }
    return value;
  }

  get jwtAccessExpiresIn() {
    return process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  }

  get jwtRefreshExpiresIn() {
    return process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';
  }

  get googleClientIds() {
    const raw = process.env.GOOGLE_CLIENT_IDS ?? '';
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  get corsOrigins() {
    const raw = process.env.CORS_ORIGINS ?? '';
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get refreshCookieName() {
    return process.env.REFRESH_COOKIE_NAME ?? 'my_phone_agent_refresh';
  }

  get cookieDomain() {
    return process.env.COOKIE_DOMAIN;
  }

  get refreshCookieMaxAgeMs() {
    return Number(process.env.REFRESH_COOKIE_MAX_AGE_MS ?? 30 * 24 * 60 * 60 * 1000);
  }

  get exposeDevOtp() {
    return !this.isProduction && process.env.EXPOSE_DEV_OTP !== 'false';
  }

  get otpProvider(): OtpProvider {
    return process.env.OTP_PROVIDER === 'TWILIO' ? 'TWILIO' : 'DEV_LOG';
  }

  get twilioAccountSid() {
    return process.env.TWILIO_ACCOUNT_SID;
  }

  get twilioAuthToken() {
    return process.env.TWILIO_AUTH_TOKEN;
  }

  get twilioFromNumber() {
    return process.env.TWILIO_FROM_NUMBER;
  }

  get otpDefaultCountryCode() {
    const raw = process.env.OTP_DEFAULT_COUNTRY_CODE?.trim();
    if (!raw) {
      return '+91';
    }

    return raw.startsWith('+') ? raw : `+${raw}`;
  }

  get ollamaBaseUrl() {
    const raw = process.env.OLLAMA_BASE_URL?.trim();
    return (raw || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  }

  get ollamaModel() {
    return process.env.OLLAMA_MODEL?.trim() || 'gemma3:4b';
  }

  get ollamaTimeoutMs() {
    const value = Number(process.env.OLLAMA_TIMEOUT_MS ?? 15000);
    if (!Number.isFinite(value) || value < 1000) {
      return 15000;
    }
    return Math.floor(value);
  }

  get passwordResetExpiryMs() {
    return Number(process.env.PASSWORD_RESET_EXPIRY_MS ?? 30 * 60 * 1000);
  }
}
