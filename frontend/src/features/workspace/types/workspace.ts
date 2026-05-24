import type { UserProfile } from '@/features/auth/types/auth';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type WorkspacePermissions = {
  contactsPermission: PermissionState;
  callPermission: PermissionState;
};

export type AgentPlugins = {
  smartCall: boolean;
  messageDraft: boolean;
  emailComposer: boolean;
  autoSummaryLogs: boolean;
};

export type AgentSafety = {
  confirmSensitiveAction: boolean;
  dailyAutomationLimit: number;
  auditRetentionDays: number;
};

export type AgentSettings = {
  plugins: AgentPlugins;
  safety: AgentSafety;
};

export type WorkspaceProfileResponse = {
  user: UserProfile;
  permissions: WorkspacePermissions;
  agentSettings: AgentSettings;
};

export type WorkspaceProfileUpdateResponse = {
  user: UserProfile;
};

export type ExecutionHistoryItem = {
  id: string;
  actionId: string;
  prompt: string;
  safetyCount: number;
  status: 'success' | 'attention' | string;
  targetContactName?: string | null;
  targetPhoneNumber?: string | null;
  callStatus?: string | null;
  executedAt: string;
};

export type ExecutionRun = {
  id: string;
  userId: string;
  actionId: string;
  prompt: string;
  safetyCount: number;
  status: 'success' | 'attention' | string;
  targetContactName?: string | null;
  targetPhoneNumber?: string | null;
  callStatus?: string | null;
  executedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionAuditItem = {
  id: string;
  runId: string;
  title: string;
  detail: string;
  status: string;
  createdAt: string;
};

export type CreateExecutionAuditInput = {
  title: string;
  detail: string;
  status?: string;
};

export type CreateExecutionInput = {
  actionId: string;
  prompt: string;
  safetyCount: number;
  status: 'success' | 'attention' | string;
  targetContactName?: string;
  targetPhoneNumber?: string;
  callStatus?: string;
  executedAt?: string;
  audits?: CreateExecutionAuditInput[];
};

export type ExecuteAgentInput = {
  actionId: 'call' | 'message' | 'email' | 'settings';
  prompt: string;
  safetyCount: number;
  targetContactName?: string;
  targetPhoneNumber?: string;
  callStatus?: string;
};

export type AgentExecutionResult = {
  summary: string;
  planSteps: string[];
  riskLevel: 'low' | 'medium' | 'high';
  followUpSuggestion: string;
  callRecommendation?: string;
  provider: 'ollama' | 'fallback' | string;
  model: string;
};

export type ExecuteAgentResponse = {
  run: ExecutionRun;
  agent: AgentExecutionResult;
};

export type FollowUpTemplate = {
  id: string;
  title: string;
  slotId: string;
  channel: 'notification' | 'message' | 'email';
  note: string;
};

export type FollowUpItem = {
  id: string;
  userId: string;
  runId?: string | null;
  actionId: string;
  title: string;
  note: string;
  channel: 'notification' | 'message' | 'email' | string;
  dueAt: string;
  status: 'pending' | 'done' | string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFollowUpInput = {
  runId?: string;
  actionId: string;
  title: string;
  note: string;
  channel: 'notification' | 'message' | 'email';
  dueAt: string;
};
