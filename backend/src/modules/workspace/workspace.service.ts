import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';

import { EnvService } from '@/config/env';
import { PrismaService } from '@/database/prisma.service';
import type { CreateAgentExecutionDto } from '@/modules/workspace/dto/create-agent-execution.dto';
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

const DEFAULT_PLAN_STEPS: Record<string, string[]> = {
  call: [
    'Validate contact details and confirm call objective.',
    'Start call flow with minimum required permissions.',
    'Capture summary and prepare follow-up reminder.'
  ],
  message: [
    'Draft concise message with clear action request.',
    'Check tone and deadline before send.',
    'Track delivery and create follow-up if no response.'
  ],
  email: [
    'Create structured email draft with subject and CTA.',
    'Run quick security check for sensitive text.',
    'Send after review and queue follow-up reminder.'
  ],
  settings: [
    'Validate requested device setting changes.',
    'Apply only non-destructive configuration updates.',
    'Verify applied values and log summary.'
  ]
};

type AgentRiskLevel = 'low' | 'medium' | 'high';

type AgentPlan = {
  summary: string;
  planSteps: string[];
  riskLevel: AgentRiskLevel;
  followUpSuggestion: string;
  callRecommendation?: string;
  provider: 'ollama' | 'fallback';
  model: string;
};

type OllamaGenerateResponse = {
  response?: string;
};

const asRecord = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> => {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return {};
  }

  return value as Record<string, unknown>;
};

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService
  ) {}

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

  async executeAgentTask(userId: string, dto: CreateAgentExecutionDto) {
    const agentPlan = await this.generateAgentPlan(dto);
    const status = agentPlan.riskLevel === 'high' ? 'attention' : 'success';
    const callStatus = this.resolveCallStatus(dto, agentPlan);
    const executedAt = new Date().toISOString();

    const audits: NonNullable<CreateExecutionDto['audits']> = [
      {
        title: 'Agent planning complete',
        detail: this.toAuditDetail(agentPlan.summary),
        status: 'ok'
      },
      {
        title: 'Execution steps',
        detail: this.toAuditDetail(
          agentPlan.planSteps.map((step, index) => `${index + 1}. ${step}`).join(' ')
        ),
        status: 'ok'
      },
      {
        title: 'Risk assessment',
        detail: this.toAuditDetail(
          `Risk level: ${agentPlan.riskLevel}. ${agentPlan.followUpSuggestion}`
        ),
        status: status === 'success' ? 'ok' : 'info'
      },
      {
        title: 'Model provider',
        detail: this.toAuditDetail(`${agentPlan.provider}:${agentPlan.model}`),
        status: 'info'
      }
    ];

    if (dto.actionId === 'call' && callStatus) {
      audits.push({
        title: 'Smart call recommendation',
        detail: this.toAuditDetail(callStatus),
        status: 'info'
      });
    }

    const run = await this.createExecution(userId, {
      actionId: dto.actionId,
      prompt: dto.prompt,
      safetyCount: dto.safetyCount ?? 0,
      status,
      targetContactName: dto.targetContactName,
      targetPhoneNumber: dto.targetPhoneNumber,
      callStatus,
      executedAt,
      audits
    });

    return {
      run,
      agent: {
        summary: agentPlan.summary,
        planSteps: agentPlan.planSteps,
        riskLevel: agentPlan.riskLevel,
        followUpSuggestion: agentPlan.followUpSuggestion,
        callRecommendation: agentPlan.callRecommendation,
        provider: agentPlan.provider,
        model: agentPlan.model
      }
    };
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

  private async generateAgentPlan(dto: CreateAgentExecutionDto): Promise<AgentPlan> {
    const promptLines = [
      'You are an Android phone automation planner.',
      'Return valid JSON only (no markdown, no code fences).',
      'Use schema: {"summary":"string","planSteps":["step1","step2"],"riskLevel":"low|medium|high","followUpSuggestion":"string","callRecommendation":"string optional"}',
      `actionId: ${dto.actionId}`,
      `userPrompt: ${dto.prompt}`,
      `safetyChecksEnabled: ${dto.safetyCount ?? 0}`,
      `targetContactName: ${dto.targetContactName ?? ''}`,
      `targetPhoneNumber: ${dto.targetPhoneNumber ?? ''}`,
      `existingCallStatus: ${dto.callStatus ?? ''}`
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.env.ollamaTimeoutMs);

    try {
      const response = await fetch(`${this.env.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.env.ollamaModel,
          prompt: promptLines.join('\n'),
          stream: false,
          format: 'json',
          options: {
            temperature: 0.2
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as OllamaGenerateResponse;
      const parsed = this.parseOllamaJson(payload.response);

      const summary = this.sanitizeText(
        typeof parsed?.summary === 'string' ? parsed.summary : '',
        240
      );
      const followUpSuggestion = this.sanitizeText(
        typeof parsed?.followUpSuggestion === 'string' ? parsed.followUpSuggestion : '',
        240
      );
      const callRecommendation = this.sanitizeText(
        typeof parsed?.callRecommendation === 'string' ? parsed.callRecommendation : '',
        240
      );

      const rawSteps = Array.isArray(parsed?.planSteps)
        ? parsed.planSteps
        : typeof parsed?.planSteps === 'string'
          ? parsed.planSteps.split(/\n+/g)
          : [];

      const planSteps = rawSteps
        .map((value) => this.sanitizeText(String(value), 100))
        .filter(Boolean)
        .slice(0, 5);

      const riskRaw = typeof parsed?.riskLevel === 'string' ? parsed.riskLevel.toLowerCase() : '';
      const riskLevel: AgentRiskLevel =
        riskRaw === 'low' || riskRaw === 'medium' || riskRaw === 'high' ? riskRaw : 'medium';

      return {
        summary: summary || this.defaultSummary(dto.actionId),
        planSteps: planSteps.length > 0 ? planSteps : DEFAULT_PLAN_STEPS[dto.actionId],
        riskLevel,
        followUpSuggestion:
          followUpSuggestion || 'Review outcome and schedule follow-up if response is delayed.',
        callRecommendation: dto.actionId === 'call' ? callRecommendation || undefined : undefined,
        provider: 'ollama',
        model: this.env.ollamaModel
      };
    } catch (error) {
      this.logger.warn(`Falling back to deterministic planner. Reason: ${(error as Error).message}`);
      return this.buildFallbackPlan(dto);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildFallbackPlan(dto: CreateAgentExecutionDto): AgentPlan {
    const summary = this.defaultSummary(dto.actionId);

    return {
      summary,
      planSteps: DEFAULT_PLAN_STEPS[dto.actionId],
      riskLevel: dto.actionId === 'settings' ? 'medium' : 'low',
      followUpSuggestion: 'Confirm final result and create reminder for unresolved responses.',
      callRecommendation:
        dto.actionId === 'call'
          ? `Prepare call using ${dto.targetContactName || dto.targetPhoneNumber || 'selected contact'}.`
          : undefined,
      provider: 'fallback',
      model: 'deterministic-plan'
    };
  }

  private parseOllamaJson(value?: string): Record<string, unknown> | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start >= 0 && end > start) {
        const candidate = trimmed.slice(start, end + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  private resolveCallStatus(dto: CreateAgentExecutionDto, plan: AgentPlan) {
    if (dto.actionId !== 'call') {
      return dto.callStatus;
    }

    if (dto.callStatus?.trim()) {
      return this.sanitizeText(dto.callStatus, 260);
    }

    if (plan.callRecommendation) {
      return this.sanitizeText(`LLM: ${plan.callRecommendation}`, 260);
    }

    if (dto.targetPhoneNumber) {
      return this.sanitizeText(`Ready to dial ${dto.targetPhoneNumber}`, 260);
    }

    if (dto.targetContactName) {
      return this.sanitizeText(`Ready to search phonebook for ${dto.targetContactName}`, 260);
    }

    return 'Smart call plan prepared.';
  }

  private defaultSummary(actionId: string) {
    if (actionId === 'call') {
      return 'Prepared a safe call execution plan with contact lookup and summary logging.';
    }
    if (actionId === 'message') {
      return 'Prepared a concise message workflow with delivery and follow-up checks.';
    }
    if (actionId === 'email') {
      return 'Prepared an email draft workflow with quality and security checks.';
    }
    return 'Prepared safe settings-update workflow with verification steps.';
  }

  private sanitizeText(value: string, maxLength: number) {
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  private toAuditDetail(value: string) {
    return this.sanitizeText(value, 260);
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
