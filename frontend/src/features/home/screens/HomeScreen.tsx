import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { QuickActionCard } from '@/features/home/components/QuickActionCard';
import { useAppTheme } from '@/theme/useAppTheme';

type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'call',
    title: 'Smart Call',
    description: 'Call contact and summarize discussion.',
    icon: '📞'
  },
  {
    id: 'message',
    title: 'Compose Message',
    description: 'Draft and send message with context.',
    icon: '💬'
  },
  {
    id: 'email',
    title: 'Write Email',
    description: 'Generate and send a structured email.',
    icon: '✉️'
  },
  {
    id: 'settings',
    title: 'Phone Settings',
    description: 'Apply safe automation for device setup.',
    icon: '⚙️'
  }
];

export const HomeScreen = () => {
  const theme = useAppTheme();
  const { user, logout } = useAuth();
  const [lastAction, setLastAction] = useState<string | null>(null);

  const greetingName = useMemo(() => {
    if (user?.fullName?.trim()) {
      return user.fullName;
    }

    if (user?.email) {
      return user.email.split('@')[0];
    }

    if (user?.phoneNumber) {
      return `User ${user.phoneNumber.slice(-4)}`;
    }

    return 'Agent User';
  }, [user]);

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg
          }
        ]}
      >
        <AppText style={styles.heroTitle}>Welcome back, {greetingName}</AppText>
        <AppText muted style={styles.heroSubtitle}>
          Your phone agent is online and ready for secure automation.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Quick Actions</AppText>
        <View style={styles.actionList}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onPress={() => {
                setLastAction(action.title);
              }}
            />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.activityCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md
          }
        ]}
      >
        <AppText style={styles.activityTitle}>Activity</AppText>
        <AppText muted>
          {lastAction
            ? `Last selected action: ${lastAction}`
            : 'No action selected yet. Choose one to continue.'}
        </AppText>
      </View>

      <Button label="Logout" variant="secondary" onPress={() => void logout()} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14
  },
  hero: {
    borderWidth: 1,
    padding: 16,
    gap: 8
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800'
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  actionList: {
    gap: 10
  },
  activityCard: {
    borderWidth: 1,
    padding: 14,
    gap: 6
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700'
  }
});
