import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useAppTheme } from '@/theme/useAppTheme';

type AgentSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'AgentSettings'>;

type PluginItem = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

type SafetySetting = {
  id: string;
  title: string;
  value: string;
  description: string;
};

const DEFAULT_PLUGINS: PluginItem[] = [
  {
    id: 'smart-call',
    title: 'Smart Call Engine',
    description: 'Phonebook lookup and safe call launch workflow.',
    enabled: true
  },
  {
    id: 'message-draft',
    title: 'Message Draft Assistant',
    description: 'Creates quick message drafts for follow-ups.',
    enabled: true
  },
  {
    id: 'email-composer',
    title: 'Email Composer',
    description: 'Builds structured email drafts with summary tone.',
    enabled: true
  },
  {
    id: 'auto-summary',
    title: 'Auto Summary Logs',
    description: 'Generates end-of-run summary notes for history.',
    enabled: false
  }
];

const DEFAULT_SAFETY: SafetySetting[] = [
  {
    id: 'confirm-sensitive',
    title: 'Sensitive Action Confirmation',
    value: 'ON',
    description: 'Ask before call/message/email send actions.'
  },
  {
    id: 'daily-limit',
    title: 'Daily Automation Limit',
    value: '25 actions/day',
    description: 'Hard cap to reduce accidental bulk actions.'
  },
  {
    id: 'audit-retention',
    title: 'Audit Retention',
    value: '30 days',
    description: 'Keep execution audit logs for compliance review.'
  }
];

export const AgentSettingsScreen = ({ navigation }: AgentSettingsScreenProps) => {
  const theme = useAppTheme();
  const [plugins, setPlugins] = useState<PluginItem[]>(DEFAULT_PLUGINS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeCount = useMemo(
    () => plugins.filter((item) => item.enabled).length,
    [plugins]
  );

  const togglePlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((item) =>
        item.id === pluginId ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

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
          Active plugins: {activeCount}/{plugins.length}
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
          {plugins.map((plugin) => (
            <Pressable
              key={plugin.id}
              onPress={() => togglePlugin(plugin.id)}
              style={[
                styles.row,
                {
                  borderColor: plugin.enabled ? theme.colors.primary : theme.colors.border,
                  backgroundColor: plugin.enabled ? theme.colors.surfaceAlt : theme.colors.surface
                }
              ]}
            >
              <View style={styles.rowMeta}>
                <AppText style={styles.rowTitle}>{plugin.title}</AppText>
                <AppText muted style={styles.rowDetail}>
                  {plugin.description}
                </AppText>
              </View>
              <AppText style={styles.stateLabel}>{plugin.enabled ? 'ON' : 'OFF'}</AppText>
            </Pressable>
          ))}
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
          {DEFAULT_SAFETY.map((setting) => (
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

      <Button
        label="Save Settings"
        onPress={() => {
          setStatusMessage(`Settings saved. ${activeCount} plugins currently active.`);
        }}
      />

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
