import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { EnvService } from '@/config/env';

type JwtPayload = {
  sub: string;
  email: string | null;
  role: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwtAccessSecret
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
  }
}
