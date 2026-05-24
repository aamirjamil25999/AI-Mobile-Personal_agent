import { Module } from '@nestjs/common';

import { EnvService } from '@/config/env';
import { PrismaService } from '@/database/prisma.service';
import { WorkspaceController } from '@/modules/workspace/workspace.controller';
import { WorkspaceService } from '@/modules/workspace/workspace.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, PrismaService, EnvService],
  exports: [WorkspaceService]
})
export class WorkspaceModule {}
