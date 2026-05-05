import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { requestNotificationPermissions } from '../../lib/notifications';
import { requestPinAppWidget } from '../../modules/focus-widget';
import { Card } from '../../components/ui/Card';

/**
 * SettingsScreen: Gestisce le preferenze dell'utente, le integrazioni di sistema (Widget)
 * e il tema dell'applicazione FocusFlow.
 */
export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = React.useState(false);
  const [showWidgetGuide, setShowWidgetGuide] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);

  // Recupera i dati dell'utente loggato al caricamento della schermata
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  /**
   * Gestisce l'abilitazione delle notifiche push.
   */
  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Permesso Negato", "Abilita le notifiche nelle impostazioni del tuo dispositivo.");
        setNotifications(false);
        return;
      }
    }
    setNotifications(value);
  };

  /**
   * Gestisce la richiesta di aggiunta del widget alla home screen (Android).
   */
  const handleAddWidget = async () => {
    if (Platform.OS === 'android') {
      try {
        // Tentativo di pinning automatico del widget (Android 8+)
        await requestPinAppWidget();
      } catch (e) {
        console.log("Pinning non supportato o fallito", e);
      }
      setShowWidgetGuide(true);
    } else {
      Alert.alert("Widget", "I widget sono attualmente ottimizzati per Android. Il supporto iOS è in arrivo.");
    }
  };

  /**
   * Gestisce il logout dell'utente.
   */
  const handleLogout = async () => {
    Alert.alert("Esci", "Sei sicuro di voler uscire da FocusFlow?", [
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

  /**
   * Componente helper per riga di impostazione singola.
   */
  const SettingItem = ({ icon, title, subtitle, onPress, rightElement, color = theme.colors.text }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: theme.colors.border }]} 
      onPress={onPress} 
      disabled={!onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryDim }]}>
          <Feather name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={[styles.settingTitle, { color, fontFamily: theme.typography.sans }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.textMuted, fontFamily: theme.typography.sans }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (onPress && <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />)}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>Impostazioni</Text>
      </View>

      {/* Card Profilo Utente */}
      <Card style={styles.profileCard}>
        <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.avatarText, { color: theme.colors.background }]}>
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>
            {user?.email ? 'Utente FocusFlow' : 'Ospite'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textMuted }]}>{user?.email || 'Login non effettuato'}</Text>
        </View>
      </Card>

      {/* Sezione Aspetto (Nuova) */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Aspetto</Text>
        <View style={[styles.group, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SettingItem 
            icon={isDark ? "moon" : "sun"} 
            title="Dark Mode" 
            subtitle="Passa dal tema chiaro al tema scuro"
            rightElement={
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme} 
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryDim }} 
                thumbColor={isDark ? theme.colors.primary : theme.colors.textMuted}
              />
            }
          />
        </View>
      </View>

      {/* Sezione Integrazioni */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Integrazione Sistema</Text>
        <View style={[styles.group, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SettingItem 
            icon="layout" 
            title="Widget Home & Lockscreen" 
            subtitle="Monitora le tue attività senza aprire l'app"
            onPress={handleAddWidget}
            rightElement={
              <View style={[styles.addPill, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.addPillText, { color: theme.colors.background }]}>AGGIUNGI</Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Sezione Preferenze App */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Preferenze App</Text>
        <View style={[styles.group, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SettingItem 
            icon="bell" 
            title="Notifiche" 
            subtitle="Promemoria abitudini e mood"
            rightElement={
              <Switch 
                value={notifications} 
                onValueChange={toggleNotifications} 
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryDim }} 
                thumbColor={notifications ? theme.colors.primary : theme.colors.textMuted}
              />
            }
          />
          <SettingItem 
            icon="log-out" 
            title="Esci da FocusFlow" 
            color={theme.colors.error} 
            onPress={handleLogout}
          />
        </View>
      </View>

      {/* Modal Guida Widget */}
      <Modal
        visible={showWidgetGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWidgetGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Guida Widget</Text>
              <TouchableOpacity onPress={() => setShowWidgetGuide(false)}>
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.guideSteps}>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}><Text style={[styles.stepNumberText, { color: theme.colors.background }]}>1</Text></View>
                <Text style={[styles.stepText, { color: theme.colors.text }]}>Premi a lungo sulla tua Home Screen e seleziona "Widget".</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}><Text style={[styles.stepNumberText, { color: theme.colors.background }]}>2</Text></View>
                <Text style={[styles.stepText, { color: theme.colors.text }]}>Cerca "FocusFlow" nella lista dei widget disponibili.</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}><Text style={[styles.stepNumberText, { color: theme.colors.background }]}>3</Text></View>
                <Text style={[styles.stepText, { color: theme.colors.text }]}>Trascina il widget sulla Home o nel Blocco Schermo.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]} 
              onPress={() => setShowWidgetGuide(false)}
            >
              <Text style={[styles.closeBtnText, { color: theme.colors.text }]}>Ho capito</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 80, paddingHorizontal: 25, paddingBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold' },
  profileCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 20, 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    marginBottom: 30 
  },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold' },
  profileInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  userEmail: { fontSize: 14 },
  section: { marginBottom: 25 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 30, marginBottom: 10 },
  group: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  addPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addPillText: { fontSize: 10, fontWeight: '900' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 30, padding: 25, width: '100%', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  guideSteps: { marginBottom: 30 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  stepNumberText: { fontWeight: 'bold', fontSize: 14 },
  stepText: { fontSize: 15, flex: 1, lineHeight: 22 },
  closeBtn: { paddingVertical: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1 },
  closeBtnText: { fontWeight: 'bold', fontSize: 16 }
});
