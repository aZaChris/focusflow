import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { requestNotificationPermissions } from '../../lib/notifications';
import { requestPinAppWidget } from '../../modules/focus-widget';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(false);
  const [showWidgetGuide, setShowWidgetGuide] = React.useState(false);
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

  const handleAddWidget = async () => {
    if (Platform.OS === 'android') {
      try {
        // Tentativo di pinning automatico (Android 8+)
        await requestPinAppWidget();
      } catch (e) {
        console.log("Pinning non supportato o fallito", e);
      }
      setShowWidgetGuide(true);
    } else {
      Alert.alert("Widget", "I widget sono attualmente ottimizzati per Android.");
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>Impostazioni</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.email ? 'Utente FocusFlow' : 'Ospite'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'Login non effettuato'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Integrazione Sistema</Text>
        <View style={styles.group}>
          <SettingItem 
            icon="layout" 
            title="Widget Home & Lockscreen" 
            subtitle="Monitora le tue attività senza aprire l'app"
            onPress={handleAddWidget}
            rightElement={
              <View style={styles.addPill}>
                <Text style={styles.addPillText}>AGGIUNGI</Text>
              </View>
            }
          />
        </View>
      </View>

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
                onValueChange={toggleNotifications} 
                trackColor={{ false: colors.border, true: colors.accentDim }} 
                thumbColor={notifications ? colors.accent : colors.muted}
              />
            }
          />
          <SettingItem 
            icon="log-out" 
            title="Esci" 
            color={colors.activities.red} 
            onPress={handleLogout}
          />
        </View>
      </View>

      <Modal
        visible={showWidgetGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWidgetGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guida Widget</Text>
              <TouchableOpacity onPress={() => setShowWidgetGuide(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.guideSteps}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                <Text style={styles.stepText}>Premi a lungo sulla tua Home Screen e seleziona "Widget".</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                <Text style={styles.stepText}>Cerca "FocusFlow" nella lista dei widget disponibili.</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                <Text style={styles.stepText}>Trascina il widget sulla Home o nel Blocco Schermo.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setShowWidgetGuide(false)}
            >
              <Text style={styles.closeBtnText}>Ho capito</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  settingTitle: { fontSize: 16, fontWeight: '600', fontFamily: typography.sans, color: colors.text },
  settingSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  addPill: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addPillText: { color: colors.bg, fontSize: 10, fontWeight: '900' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 30, padding: 25, width: '100%', borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  guideSteps: { marginBottom: 30 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  stepNumberText: { color: colors.bg, fontWeight: 'bold', fontSize: 14 },
  stepText: { color: colors.text, fontSize: 15, flex: 1, lineHeight: 22 },
  closeBtn: { backgroundColor: colors.surface2, paddingVertical: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  closeBtnText: { color: colors.text, fontWeight: 'bold', fontSize: 16 }
});
