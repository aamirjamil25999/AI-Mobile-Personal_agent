export type QuickActionId = 'call' | 'message' | 'email' | 'settings';

export type QuickAction = {
  id: QuickActionId;
  title: string;
  description: string;
  icon: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
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

export const getQuickActionById = (actionId: QuickActionId) =>
  QUICK_ACTIONS.find((item) => item.id === actionId) ?? QUICK_ACTIONS[0];
