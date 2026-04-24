import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import MiniTimeline from '../../components/timeline/MiniTimeline';
import { updateLockScreenNotification, requestNotificationPermissions } from '../../lib/notifications';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(false);
  const [aiFeedback, setAiFeedback] = React.useState(true);
  const [lockScreenTimeline, setLockScreenTimeline] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permesso Negato", "Abilita le notifiche nelle impostazioni.");
        setNotifications(false);
        return;
      }
    }
    setNotifications(value);
  };

  const toggleLockScreenTimeline = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permesso Negato", "Abilita le notifiche per la timeline.");
        setLockScreenTimeline(false);
        return;
      }
    }
    setLockScreenTimeline(value);
    await updateLockScreenNotification(value);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Sei sicuro di voler uscire?", [
      { text: "Annulla", style: "cancel" },
      { 
        text: "Esci", 
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (!error) router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement, color = colors.text }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
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
      <View style={styles.header}><Text style={styles.title}>Impostazioni</Text></View>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</Text></View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.email ? 'Utente FocusFlow' : 'Ospite'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'Login non effettuato'}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Integrazione Sistema</Text>
        <View style={styles.group}>
          <SettingItem icon="layout" title="Timeline nel Blocco Schermo" subtitle="Mostra impegni al risveglio del display"
            rightElement={<Switch value={lockScreenTimeline} onValueChange={toggleLockScreenTimeline} trackColor={{ false: colors.border, true: colors.accentDim }} thumbColor={lockScreenTimeline ? colors.accent : colors.muted}/>}
          />
          {lockScreenTimeline && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Anteprima Blocco Schermo:</Text>
              <View style={styles.iphoneFrame}>
                <View style={styles.iphoneStatusBar}><Feather name="wifi" size={10} color={colors.text}/><Feather name="battery" size={12} color={colors.text}/></View>
                <Text style={styles.iphoneTime}>09:41</Text>
                <MiniTimeline compact />
              </View>
            </View>
          )}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preferenze App</Text>
        <View style={styles.group}>
          <SettingItem icon="bell" title="Notifiche" subtitle="Promemoria abitudini e mood"
            rightElement={<Switch value={notifications} onValueChange={toggleNotifications} trackColor={{ false: colors.border, true: colors.accentDim }} thumbColor={notifications ? colors.accent : colors.muted}/>}
          />
          <SettingItem icon="log-out" title="Esci" color={colors.activities.red} onPress={handleLogout}/>
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 20 },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 32, fontWeight: 'bold' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 30 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.bg, fontSize: 24, fontWeight: 'bold' },
  profileInfo: { marginLeft: 15, flex: 1 },
  userName: { color: colors.text, fontSize: 18, fontWeight: 'bold', fontFamily: typography.sans },
  userEmail: { color: colors.muted, fontSize: 14 },
  section: { marginBottom: 25 },
  sectionLabel: { color: colors.muted, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 30, marginBottom: 10 },
  group: { backgroundColor: colors.surface, marginHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(200, 240, 74, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  settingTitle: { fontSize: 16, fontWeight: '600', fontFamily: typography.sans },
  settingSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  previewContainer: { padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center' },
  previewLabel: { color: colors.muted, fontSize: 12, marginBottom: 15 },
  iphoneFrame: { width: 280, height: 320, backgroundColor: colors.bg, borderRadius: 40, borderWidth: 8, borderColor: '#333', padding: 20, alignItems: 'center' },
  iphoneStatusBar: { flexDirection: 'row', width: '100%', justifyContent: 'flex-end', gap: 5, marginBottom: 10 },
  iphoneTime: { color: colors.text, fontSize: 48, fontWeight: '300', marginBottom: 20 }
});
