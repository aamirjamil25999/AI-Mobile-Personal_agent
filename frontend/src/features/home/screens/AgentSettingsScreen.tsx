import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';
import {
  useGetAgentSettingsQuery,
  useUpdateAgentSettingsMutation
} from '@/features/workspace/api/workspaceApi';
import type { AgentSettings } from '@/features/workspace/types/workspace';

type AgentSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'AgentSettings'>;

type PluginKey = keyof AgentSettings['plugins'];

const PLUGIN_CONFIG: Array<{
  key: PluginKey;
  title: string;
  description: string;
}> = [
  {
    key: 'smartCall',
    title: 'Smart Call Engine',
    description: 'Phonebook lookup and safe call launch workflow.'
  },
  {
    key: 'messageDraft',
    title: 'Message Draft Assistant',
    description: 'Creates quick message drafts for follow-ups.'
  },
  {
    key: 'emailComposer',
    title: 'Email Composer',
    description: 'Builds structured email drafts with summary tone.'
  },
  {
    key: 'autoSummaryLogs',
    title: 'Auto Summary Logs',
    description: 'Generates end-of-run summary notes for history.'
  }
];

const defaultSettings: AgentSettings = {
  plugins: {
    smartCall: true,
    messageDraft: true,
    emailComposer: true,
    autoSummaryLogs: false
  },
  safety: {
    confirmSensitiveAction: true,
    dailyAutomationLimit: 25,
    auditRetentionDays: 30
  }
};

const normalizeSettings = (value: Partial<AgentSettings> | undefined): AgentSettings => ({
  plugins: {
    smartCall: Boolean(value?.plugins?.smartCall ?? defaultSettings.plugins.smartCall),
    messageDraft: Boolean(value?.plugins?.messageDraft ?? defaultSettings.plugins.messageDraft),
    emailComposer: Boolean(value?.plugins?.emailComposer ?? defaultSettings.plugins.emailComposer),
    autoSummaryLogs: Boolean(value?.plugins?.autoSummaryLogs ?? defaultSettings.plugins.autoSummaryLogs)
  },
  safety: {
    confirmSensitiveAction: Boolean(
      value?.safety?.confirmSensitiveAction ?? defaultSettings.safety.confirmSensitiveAction
    ),
    dailyAutomationLimit:
      Number(value?.safety?.dailyAutomationLimit) || defaultSettings.safety.dailyAutomationLimit,
    auditRetentionDays:
      Number(value?.safety?.auditRetentionDays) || defaultSettings.safety.auditRetentionDays
  }
});

export const AgentSettingsScreen = ({ navigation }: AgentSettingsScreenProps) => {
  const theme = useAppTheme();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgentSettings>(defaultSettings);

  const { data, isLoading, refetch } = useGetAgentSettingsQuery();
  const [updateAgentSettings, { isLoading: isSaving }] = useUpdateAgentSettingsMutation();

  useEffect(() => {
    if (data) {
      setSettings(normalizeSettings(data));
    }
  }, [data]);

  const activeCount = useMemo(
    () => Object.values(settings.plugins).filter(Boolean).length,
    [settings.plugins]
  );

  const togglePlugin = (pluginKey: PluginKey) => {
    setSettings((prev) => ({
      ...prev,
      plugins: {
        ...prev.plugins,
        [pluginKey]: !prev.plugins[pluginKey]
      }
    }));
  };

  const safetyCards = useMemo(
    () => [
      {
        id: 'confirm-sensitive',
        title: 'Sensitive Action Confirmation',
        value: settings.safety.confirmSensitiveAction ? 'ON' : 'OFF',
        description: 'Ask before call/message/email send actions.'
      },
      {
        id: 'daily-limit',
        title: 'Daily Automation Limit',
        value: `${settings.safety.dailyAutomationLimit} actions/day`,
        description: 'Hard cap to reduce accidental bulk actions.'
      },
      {
        id: 'audit-retention',
        title: 'Audit Retention',
        value: `${settings.safety.auditRetentionDays} days`,
        description: 'Keep execution audit logs for compliance review.'
      }
    ],
    [settings.safety.auditRetentionDays, settings.safety.confirmSensitiveAction, settings.safety.dailyAutomationLimit]
  );

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg
          }
        ]}
      >
        <AppText style={styles.title}>Agent Settings</AppText>
        <AppText muted style={styles.subtitle}>
          Manage plugin modules and guardrails for automation runtime.
        </AppText>
        <AppText muted style={styles.subtitle}>
          Active plugins: {activeCount}/{PLUGIN_CONFIG.length}
        </AppText>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md
          }
        ]}
      >
        <AppText style={styles.blockTitle}>Plugin Controls</AppText>
        <View style={styles.list}>
          {PLUGIN_CONFIG.map((plugin) => {
            const isEnabled = settings.plugins[plugin.key];
            return (
              <Pressable
                key={plugin.key}
                onPress={() => togglePlugin(plugin.key)}
                style={[
                  styles.row,
                  {
                    borderColor: isEnabled ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isEnabled ? theme.colors.surfaceAlt : theme.colors.surface
                  }
                ]}
              >
                <View style={styles.rowMeta}>
                  <AppText style={styles.rowTitle}>{plugin.title}</AppText>
                  <AppText muted style={styles.rowDetail}>
                    {plugin.description}
                  </AppText>
                </View>
                <AppText style={styles.stateLabel}>{isEnabled ? 'ON' : 'OFF'}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md
          }
        ]}
      >
        <AppText style={styles.blockTitle}>Safety Defaults</AppText>
        <View style={styles.list}>
          {safetyCards.map((setting) => (
            <View
              key={setting.id}
              style={[
                styles.row,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt
                }
              ]}
            >
              <View style={styles.rowMeta}>
                <AppText style={styles.rowTitle}>{setting.title}</AppText>
                <AppText muted style={styles.rowDetail}>
                  {setting.description}
                </AppText>
              </View>
              <AppText style={styles.stateLabel}>{setting.value}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button
          label="Refresh"
          variant="ghost"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            void refetch();
            setStatusMessage('Settings refreshed from server.');
          }}
          isLoading={isLoading}
        />
        <Button
          label="Save Settings"
          fullWidth={false}
          style={styles.halfButton}
          onPress={async () => {
            try {
              await updateAgentSettings(settings).unwrap();
              setStatusMessage(`Settings saved. ${activeCount} plugins currently active.`);
            } catch {
              setStatusMessage('Failed to save settings.');
            }
          }}
          isLoading={isSaving}
        />
      </View>

      <View style={styles.buttonRow}>
        <Button
          label="Back To Profile"
          variant="secondary"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.navigate('ProfileAccount');
          }}
        />
        <Button
          label="Open Permissions"
          variant="ghost"
          fullWidth={false}
          style={styles.halfButton}
          onPress={() => {
            navigation.navigate('PermissionsManager');
          }}
        />
      </View>

      {statusMessage ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md
            }
          ]}
        >
          <AppText muted>{statusMessage}</AppText>
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 8
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800'
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  list: {
    gap: 8
  },
  row: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  rowMeta: {
    flex: 1,
    gap: 2
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  rowDetail: {
    fontSize: 12,
    lineHeight: 17
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '800'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  halfButton: {
    flex: 1
  }
});
