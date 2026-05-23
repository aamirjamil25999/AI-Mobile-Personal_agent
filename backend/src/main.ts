import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@/app.module';
import { EnvService } from '@/config/env';
import { PrismaService } from '@/database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true
    })
  );

  const env = app.get(EnvService);
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(env.port);
}

void bootstrap();
