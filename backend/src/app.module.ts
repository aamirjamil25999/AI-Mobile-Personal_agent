import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { EnvService } from '@/config/env';
import { PrismaService } from '@/database/prisma.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { HealthModule } from '@/modules/health/health.module';
import { UsersModule } from '@/modules/users/users.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 100
      }
    ]),
    AuthModule,
    UsersModule,
    WorkspaceModule,
    HealthModule
  ],
  providers: [
    EnvService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
