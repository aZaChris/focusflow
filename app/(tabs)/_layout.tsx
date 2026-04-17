import { Tabs } from 'expo-router';
import { colors } from '../../constants/theme';

/**
 * TabLayout: Definisce la barra di navigazione inferiore (Tab Bar).
 * Ogni Tabs.Screen corrisponde a una sezione principale dell'app.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Gestiamo l'header internamente nelle singole schermate
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      {/* Schermata principale: Focus della giornata */}
      <Tabs.Screen
        name="today"
        options={{
          title: 'Oggi',
        }}
      />
      {/* Sistema di tracciamento abitudini */}
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Abitudini',
        }}
      />
      {/* Statistiche e analisi del benessere */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
        }}
      />
      {/* Configurazione e preferenze */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Impostazioni',
        }}
      />
    </Tabs>
  );
}
