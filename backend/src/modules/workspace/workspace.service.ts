import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';

import { PrismaService } from '@/database/prisma.service';
import type { CreateExecutionDto } from '@/modules/workspace/dto/create-execution.dto';
import type { CreateFollowUpDto } from '@/modules/workspace/dto/create-followup.dto';
import type { FollowUpTemplateQueryDto } from '@/modules/workspace/dto/followup-template-query.dto';
import type { ListExecutionsQueryDto } from '@/modules/workspace/dto/list-executions-query.dto';
import type { ListFollowUpsQueryDto } from '@/modules/workspace/dto/list-followups-query.dto';
import type { SnoozeFollowUpDto } from '@/modules/workspace/dto/snooze-followup.dto';
import type { UpdateAgentSettingsDto } from '@/modules/workspace/dto/update-agent-settings.dto';
import type { UpdateFollowUpStatusDto } from '@/modules/workspace/dto/update-followup-status.dto';
import type { UpdatePermissionsDto } from '@/modules/workspace/dto/update-permissions.dto';
import type { UpdateProfileDto } from '@/modules/workspace/dto/update-profile.dto';

const DEFAULT_PLUGIN_SETTINGS: Prisma.JsonObject = {
  smartCall: true,
  messageDraft: true,
  emailComposer: true,
  autoSummaryLogs: false
};

const DEFAULT_SAFETY_SETTINGS: Prisma.JsonObject = {
  confirmSensitiveAction: true,
  dailyAutomationLimit: 25,
  auditRetentionDays: 30
};

const DEFAULT_FOLLOWUP_TEMPLATES: Record<
  string,
  Array<{ id: string; title: string; slotId: string; channel: string; note: string }>
> = {
  call: [
    {
      id: 'call-confirm',
      title: 'Call Confirmation',
      slotId: '15m',
      channel: 'message',
      note: 'Share short recap and confirm next meeting slot.'
    },
    {
      id: 'call-docs',
      title: 'Pending Docs Reminder',
      slotId: '1h',
      channel: 'email',
      note: 'Request pending documents discussed on call.'
    }
  ],
  message: [
    {
      id: 'msg-check',
      title: 'Reply Check',
      slotId: '1h',
      channel: 'notification',
      note: 'Check if recipient replied and send follow-up if needed.'
    }
  ],
  email: [
    {
      id: 'email-ack',
      title: 'Acknowledgement Follow-up',
      slotId: '1h',
      channel: 'email',
      note: 'Send concise follow-up with key points if no response.'
    }
  ],
  settings: [
    {
      id: 'settings-verify',
      title: 'Settings Verification',
      slotId: '15m',
      channel: 'notification',
      note: 'Verify applied settings remain active and stable.'
    }
  ]
};

const asRecord = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> => {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return {};
  }

  return value as Record<string, unknown>;
};

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [preferences, agentSettings] = await Promise.all([
      this.getOrCreatePreferences(userId),
      this.getOrCreateAgentSettings(userId)
    ]);

    return {
      user: this.toSafeUser(user),
      permissions: {
        contactsPermission: preferences.contactsPermission,
        callPermission: preferences.callPermission
      },
      agentSettings: {
        plugins: asRecord(agentSettings.plugins),
        safety: asRecord(agentSettings.safety)
      }
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName || null } : {})
      }
    });

    return {
      user: this.toSafeUser(user)
    };
  }

  async getPermissions(userId: string) {
    const preferences = await this.getOrCreatePreferences(userId);

    return {
      contactsPermission: preferences.contactsPermission,
      callPermission: preferences.callPermission
    };
  }

  async updatePermissions(userId: string, dto: UpdatePermissionsDto) {
    const updated = await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        contactsPermission: dto.contactsPermission ?? 'undetermined',
        callPermission: dto.callPermission ?? 'undetermined'
      },
      update: {
        ...(dto.contactsPermission ? { contactsPermission: dto.contactsPermission } : {}),
        ...(dto.callPermission ? { callPermission: dto.callPermission } : {})
      }
    });

    return {
      contactsPermission: updated.contactsPermission,
      callPermission: updated.callPermission
    };
  }

  async getAgentSettings(userId: string) {
    const settings = await this.getOrCreateAgentSettings(userId);

    return {
      plugins: asRecord(settings.plugins),
      safety: asRecord(settings.safety)
    };
  }

  async updateAgentSettings(userId: string, dto: UpdateAgentSettingsDto) {
    const current = await this.getOrCreateAgentSettings(userId);
    const currentPlugins = asRecord(current.plugins);
    const currentSafety = asRecord(current.safety);

    const nextPlugins = {
      ...currentPlugins,
      ...(dto.plugins ?? {})
    } as Prisma.JsonObject;

    const nextSafety = {
      ...currentSafety,
      ...(dto.safety ?? {})
    } as Prisma.JsonObject;

    const updated = await this.prisma.agentSetting.update({
      where: { userId },
      data: {
        plugins: nextPlugins,
        safety: nextSafety
      }
    });

    return {
      plugins: asRecord(updated.plugins),
      safety: asRecord(updated.safety)
    };
  }

  async listExecutionHistory(userId: string, query: ListExecutionsQueryDto) {
    const limit = query.limit ?? 25;
    const runs = await this.prisma.executionRun.findMany({
      where: { userId },
      orderBy: { executedAt: 'desc' },
      take: limit
    });

    return runs.map((run) => ({
      id: run.id,
      actionId: run.actionId,
      prompt: run.prompt,
      safetyCount: run.safetyCount,
      status: run.status,
      targetContactName: run.targetContactName,
      targetPhoneNumber: run.targetPhoneNumber,
      callStatus: run.callStatus,
      executedAt: run.executedAt
    }));
  }

  async getExecution(userId: string, runId: string) {
    const run = await this.prisma.executionRun.findFirst({
      where: { id: runId, userId }
    });

    if (!run) {
      throw new NotFoundException('Execution run not found');
    }

    return run;
  }

  async getExecutionAudits(userId: string, runId: string) {
    await this.getExecution(userId, runId);
    return this.prisma.executionAudit.findMany({
      where: { runId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createExecution(userId: string, dto: CreateExecutionDto) {
    const run = await this.prisma.executionRun.create({
      data: {
        userId,
        actionId: dto.actionId,
        prompt: dto.prompt,
        safetyCount: dto.safetyCount ?? 0,
        status: dto.status ?? 'success',
        targetContactName: dto.targetContactName,
        targetPhoneNumber: dto.targetPhoneNumber,
        callStatus: dto.callStatus,
        executedAt: dto.executedAt ? new Date(dto.executedAt) : new Date()
      }
    });

    if (dto.audits?.length) {
      await this.prisma.executionAudit.createMany({
        data: dto.audits.map((audit) => ({
          runId: run.id,
          title: audit.title,
          detail: audit.detail,
          status: audit.status ?? 'info'
        }))
      });
    }

    return run;
  }

  async listFollowUpTemplates(query: FollowUpTemplateQueryDto) {
    if (query.actionId) {
      return DEFAULT_FOLLOWUP_TEMPLATES[query.actionId] ?? [];
    }

    return DEFAULT_FOLLOWUP_TEMPLATES;
  }

  async listFollowUps(userId: string, query: ListFollowUpsQueryDto) {
    const status = query.status ?? 'all';

    return this.prisma.followUpTask.findMany({
      where: {
        userId,
        ...(status !== 'all' ? { status } : {})
      },
      orderBy: { dueAt: 'asc' }
    });
  }

  async createFollowUp(userId: string, dto: CreateFollowUpDto) {
    if (dto.runId) {
      const run = await this.prisma.executionRun.findFirst({
        where: { id: dto.runId, userId }
      });
      if (!run) {
        throw new BadRequestException('Referenced execution run not found');
      }
    }

    return this.prisma.followUpTask.create({
      data: {
        userId,
        runId: dto.runId,
        actionId: dto.actionId,
        title: dto.title,
        note: dto.note,
        channel: dto.channel,
        dueAt: new Date(dto.dueAt),
        status: 'pending'
      }
    });
  }

  async updateFollowUpStatus(userId: string, followUpId: string, dto: UpdateFollowUpStatusDto) {
    const followUp = await this.prisma.followUpTask.findFirst({
      where: { id: followUpId, userId }
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up task not found');
    }

    return this.prisma.followUpTask.update({
      where: { id: followUpId },
      data: { status: dto.status }
    });
  }

  async snoozeFollowUp(userId: string, followUpId: string, dto: SnoozeFollowUpDto) {
    const followUp = await this.prisma.followUpTask.findFirst({
      where: { id: followUpId, userId }
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up task not found');
    }

    const minutes = dto.minutes ?? 60;
    const dueAt = new Date(followUp.dueAt.getTime() + minutes * 60 * 1000);

    return this.prisma.followUpTask.update({
      where: { id: followUpId },
      data: {
        dueAt,
        status: 'pending'
      }
    });
  }

  private async getOrCreatePreferences(userId: string) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        contactsPermission: 'undetermined',
        callPermission: 'undetermined'
      },
      update: {}
    });
  }

  private async getOrCreateAgentSettings(userId: string) {
    return this.prisma.agentSetting.upsert({
      where: { userId },
      create: {
        userId,
        plugins: DEFAULT_PLUGIN_SETTINGS,
        safety: DEFAULT_SAFETY_SETTINGS
      },
      update: {}
    });
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
