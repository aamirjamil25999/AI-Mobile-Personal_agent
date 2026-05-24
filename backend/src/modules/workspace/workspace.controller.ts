import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateExecutionDto } from '@/modules/workspace/dto/create-execution.dto';
import { CreateFollowUpDto } from '@/modules/workspace/dto/create-followup.dto';
import { FollowUpTemplateQueryDto } from '@/modules/workspace/dto/followup-template-query.dto';
import { ListExecutionsQueryDto } from '@/modules/workspace/dto/list-executions-query.dto';
import { ListFollowUpsQueryDto } from '@/modules/workspace/dto/list-followups-query.dto';
import { SnoozeFollowUpDto } from '@/modules/workspace/dto/snooze-followup.dto';
import { UpdateAgentSettingsDto } from '@/modules/workspace/dto/update-agent-settings.dto';
import { UpdateFollowUpStatusDto } from '@/modules/workspace/dto/update-followup-status.dto';
import { UpdatePermissionsDto } from '@/modules/workspace/dto/update-permissions.dto';
import { UpdateProfileDto } from '@/modules/workspace/dto/update-profile.dto';
import { WorkspaceService } from '@/modules/workspace/workspace.service';

@Controller('workspace')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.workspaceService.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() body: UpdateProfileDto
  ) {
    return this.workspaceService.updateProfile(user.id, body);
  }

  @Get('permissions')
  getPermissions(@CurrentUser() user: { id: string }) {
    return this.workspaceService.getPermissions(user.id);
  }

  @Put('permissions')
  updatePermissions(
    @CurrentUser() user: { id: string },
    @Body() body: UpdatePermissionsDto
  ) {
    return this.workspaceService.updatePermissions(user.id, body);
  }

  @Get('agent-settings')
  getAgentSettings(@CurrentUser() user: { id: string }) {
    return this.workspaceService.getAgentSettings(user.id);
  }

  @Put('agent-settings')
  updateAgentSettings(
    @CurrentUser() user: { id: string },
    @Body() body: UpdateAgentSettingsDto
  ) {
    return this.workspaceService.updateAgentSettings(user.id, body);
  }

  @Get('executions/history')
  listExecutionHistory(
    @CurrentUser() user: { id: string },
    @Query() query: ListExecutionsQueryDto
  ) {
    return this.workspaceService.listExecutionHistory(user.id, query);
  }

  @Post('executions')
  createExecution(
    @CurrentUser() user: { id: string },
    @Body() body: CreateExecutionDto
  ) {
    return this.workspaceService.createExecution(user.id, body);
  }

  @Get('executions/:runId')
  getExecution(
    @CurrentUser() user: { id: string },
    @Param('runId') runId: string
  ) {
    return this.workspaceService.getExecution(user.id, runId);
  }

  @Get('executions/:runId/audits')
  getExecutionAudits(
    @CurrentUser() user: { id: string },
    @Param('runId') runId: string
  ) {
    return this.workspaceService.getExecutionAudits(user.id, runId);
  }

  @Get('followups/templates')
  listFollowUpTemplates(@Query() query: FollowUpTemplateQueryDto) {
    return this.workspaceService.listFollowUpTemplates(query);
  }

  @Get('followups/inbox')
  listFollowUps(
    @CurrentUser() user: { id: string },
    @Query() query: ListFollowUpsQueryDto
  ) {
    return this.workspaceService.listFollowUps(user.id, query);
  }

  @Post('followups')
  createFollowUp(
    @CurrentUser() user: { id: string },
    @Body() body: CreateFollowUpDto
  ) {
    return this.workspaceService.createFollowUp(user.id, body);
  }

  @Patch('followups/:followUpId/status')
  updateFollowUpStatus(
    @CurrentUser() user: { id: string },
    @Param('followUpId') followUpId: string,
    @Body() body: UpdateFollowUpStatusDto
  ) {
    return this.workspaceService.updateFollowUpStatus(user.id, followUpId, body);
  }

  @Patch('followups/:followUpId/snooze')
  snoozeFollowUp(
    @CurrentUser() user: { id: string },
    @Param('followUpId') followUpId: string,
    @Body() body: SnoozeFollowUpDto
  ) {
    return this.workspaceService.snoozeFollowUp(user.id, followUpId, body);
  }
}
