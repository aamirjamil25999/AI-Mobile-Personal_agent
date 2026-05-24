import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import type { RootState } from '@/store';
import type {
  AgentSettings,
  CreateExecutionInput,
  CreateFollowUpInput,
  ExecutionAuditItem,
  ExecutionHistoryItem,
  ExecutionRun,
  FollowUpItem,
  FollowUpTemplate,
  WorkspacePermissions,
  WorkspaceProfileResponse,
  WorkspaceProfileUpdateResponse
} from '@/features/workspace/types/workspace';

const appendQuery = (url: string, params?: Record<string, string | number | undefined>) => {
  if (!params) {
    return url;
  }

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `${url}?${query}` : url;
};

export const workspaceApi = createApi({
  reducerPath: 'workspaceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    }
  }),
  tagTypes: ['Profile', 'Permissions', 'AgentSettings', 'ExecutionHistory', 'FollowUpInbox'],
  endpoints: (builder) => ({
    getProfile: builder.query<WorkspaceProfileResponse, void>({
      query: () => ({
        url: API_ENDPOINTS.workspace.profile,
        method: 'GET'
      }),
      providesTags: ['Profile', 'Permissions', 'AgentSettings']
    }),
    updateProfile: builder.mutation<WorkspaceProfileUpdateResponse, { fullName?: string }>({
      query: (body) => ({
        url: API_ENDPOINTS.workspace.profile,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Profile']
    }),
    getPermissions: builder.query<WorkspacePermissions, void>({
      query: () => ({
        url: API_ENDPOINTS.workspace.permissions,
        method: 'GET'
      }),
      providesTags: ['Permissions']
    }),
    updatePermissions: builder.mutation<WorkspacePermissions, Partial<WorkspacePermissions>>({
      query: (body) => ({
        url: API_ENDPOINTS.workspace.permissions,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Permissions']
    }),
    getAgentSettings: builder.query<AgentSettings, void>({
      query: () => ({
        url: API_ENDPOINTS.workspace.agentSettings,
        method: 'GET'
      }),
      providesTags: ['AgentSettings']
    }),
    updateAgentSettings: builder.mutation<AgentSettings, Partial<AgentSettings>>({
      query: (body) => ({
        url: API_ENDPOINTS.workspace.agentSettings,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['AgentSettings']
    }),
    getExecutionHistory: builder.query<ExecutionHistoryItem[], { limit?: number } | void>({
      query: (params) => ({
        url: appendQuery(API_ENDPOINTS.workspace.executionHistory, {
          limit: params?.limit
        }),
        method: 'GET'
      }),
      providesTags: ['ExecutionHistory']
    }),
    getExecution: builder.query<ExecutionRun, string>({
      query: (runId) => ({
        url: API_ENDPOINTS.workspace.executionById(runId),
        method: 'GET'
      })
    }),
    createExecution: builder.mutation<ExecutionRun, CreateExecutionInput>({
      query: (body) => ({
        url: API_ENDPOINTS.workspace.executions,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ExecutionHistory']
    }),
    getExecutionAudits: builder.query<ExecutionAuditItem[], string>({
      query: (runId) => ({
        url: API_ENDPOINTS.workspace.executionAudits(runId),
        method: 'GET'
      })
    }),
    getFollowUpTemplates: builder.query<
      Record<string, FollowUpTemplate[]> | FollowUpTemplate[],
      { actionId?: string } | void
    >({
      query: (params) => ({
        url: appendQuery(API_ENDPOINTS.workspace.followUpTemplates, {
          actionId: params?.actionId
        }),
        method: 'GET'
      })
    }),
    getFollowUpInbox: builder.query<FollowUpItem[], { status?: 'all' | 'pending' | 'done' } | void>({
      query: (params) => ({
        url: appendQuery(API_ENDPOINTS.workspace.followUpInbox, {
          status: params?.status
        }),
        method: 'GET'
      }),
      providesTags: ['FollowUpInbox']
    }),
    createFollowUp: builder.mutation<FollowUpItem, CreateFollowUpInput>({
      query: (body) => ({
        url: API_ENDPOINTS.workspace.followUps,
        method: 'POST',
        body
      }),
      invalidatesTags: ['FollowUpInbox']
    }),
    updateFollowUpStatus: builder.mutation<
      FollowUpItem,
      { followUpId: string; status: 'pending' | 'done' }
    >({
      query: ({ followUpId, ...body }) => ({
        url: API_ENDPOINTS.workspace.followUpStatus(followUpId),
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['FollowUpInbox']
    }),
    snoozeFollowUp: builder.mutation<FollowUpItem, { followUpId: string; minutes?: number }>({
      query: ({ followUpId, ...body }) => ({
        url: API_ENDPOINTS.workspace.followUpSnooze(followUpId),
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['FollowUpInbox']
    })
  })
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPermissionsQuery,
  useUpdatePermissionsMutation,
  useGetAgentSettingsQuery,
  useUpdateAgentSettingsMutation,
  useGetExecutionHistoryQuery,
  useGetExecutionQuery,
  useCreateExecutionMutation,
  useGetExecutionAuditsQuery,
  useGetFollowUpTemplatesQuery,
  useGetFollowUpInboxQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpStatusMutation,
  useSnoozeFollowUpMutation
} = workspaceApi;
