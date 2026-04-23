import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

/**
 * SettingsScreen: Schermata di configurazione dell'app.
 * Permette di gestire il profilo, l'abbonamento e le preferenze.
 */
export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [aiFeedback, setAiFeedback] = React.useState(true);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Sei sicuro di voler uscire?",
      [
        { text: "Annulla", style: "cancel" },
        { 
          text: "Esci", 
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement, color = colors.text }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconWrapper}>
          <Feather name={icon} size={20} color={colors.accent} />
        </View>
        <View>
          <Text style={[styles.settingTitle, { color }]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Feather name="chevron-right" size={20} color={colors.muted} />)}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Impostazioni</Text>
      </View>

      {/* PROFILO UTENTE */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>C</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>Christian</Text>
          <Text style={styles.userEmail}>christian@example.it</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Feather name="edit-3" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* ABBONAMENTO */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Abbonamento</Text>
        <TouchableOpacity style={styles.proCard} activeOpacity={0.9}>
          <View>
            <Text style={styles.proTitle}>FocusFlow Premium</Text>
            <Text style={styles.proSubtitle}>Sblocca tutte le analisi AI e Skia.</Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* PREFERENZE APP */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preferenze App</Text>
        <View style={styles.group}>
          <SettingItem 
            icon="bell" 
            title="Notifiche" 
            subtitle="Promemoria abitudini e mood"
            rightElement={
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.accentDim }}
                thumbColor={notifications ? colors.accent : colors.muted}
              />
            }
          />
          <SettingItem 
            icon="cpu" 
            title="Feedback AI" 
            subtitle="Analisi automatica del diario"
            rightElement={
              <Switch 
                value={aiFeedback} 
                onValueChange={setAiFeedback}
                trackColor={{ false: colors.border, true: colors.accentDim }}
                thumbColor={aiFeedback ? colors.accent : colors.muted}
              />
            }
          />
          <SettingItem icon="moon" title="Tema" subtitle="Scuro (Default)" />
        </View>
      </View>

      {/* ACCOUNT */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <SettingItem icon="lock" title="Cambia Password" onPress={() => {}} />
          <SettingItem icon="shield" title="Privacy Policy" onPress={() => {}} />
          <SettingItem 
            icon="log-out" 
            title="Esci dall'account" 
            color={colors.activities.red} 
            onPress={handleLogout} 
          />
        </View>
      </View>

      <Text style={styles.version}>FocusFlow v1.0.0 (Beta)</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  title: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 30,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.bg,
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2,
  },
  editBtn: {
    padding: 10,
    backgroundColor: colors.surface2,
    borderRadius: 12,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 10,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  proCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.accentDim,
  },
  proTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  proSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  proBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  proBadgeText: {
    color: colors.bg,
    fontWeight: 'bold',
    fontSize: 12,
  },
  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: 10,
  }
});
