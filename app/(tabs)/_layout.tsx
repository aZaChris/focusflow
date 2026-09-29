import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

// handoff: line-style tab icons, 22px, active/inactive tint. Simple text
// glyphs stand in for the handoff's hand-drawn SVG icon set — recreating
// those pixel-for-pixel is a separate pass, not needed to explore the IA.
const ICONS: Record<string, string> = {
  index: '▭',
  habits: '◉',
  reflect: '♡',
  settings: '⚙',
};

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="reflect" options={{ title: 'Reflect' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Subscription is a full-screen modal (handoff §7), not a tab item. */}
      <Tabs.Screen name="subscription" options={{ href: null }} />
    </Tabs>
  );
}
