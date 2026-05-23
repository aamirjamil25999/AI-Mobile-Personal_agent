import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvService {
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

  get autoCreateEmailUser() {
    return process.env.DEV_AUTO_CREATE_EMAIL_USER === 'true';
  }
}
