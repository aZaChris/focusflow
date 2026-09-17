import { Tabs } from 'expo-router';
import { color, font, fontSize } from '@/theme/tokens';
import { Icon, type IconName } from '@/components/ui';

// Handoff: 4 tabs (Today, Habits, Reflect, Settings) — Reflect merges the
// former Mood + Journal screens (segmented control inside), and Subscription
// moved out of the tab bar into a modal (app/subscription.tsx).
const TAB_ICON: Record<string, IconName> = {
  index: 'tabToday',
  habits: 'tabHabits',
  reflect: 'tabReflect',
  settings: 'tabSettings',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.tabInactive,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.border, height: 60, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: fontSize.sm, fontFamily: font.semibold },
        tabBarIcon: ({ color: tint }) => <Icon name={TAB_ICON[route.name]} size={22} color={String(tint)} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="reflect" options={{ title: 'Reflect' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
