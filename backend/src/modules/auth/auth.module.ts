import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EnvService } from '@/config/env';
import { PrismaService } from '@/database/prisma.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  providers: [AuthService, JwtStrategy, PrismaService, EnvService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
