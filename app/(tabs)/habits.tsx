import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { syncWidget } from '../../lib/widgetSync';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Habit {
  id: string;
  title: string;
  icon: string;
  streak: number;
  is_completed: boolean;
  scheduled_time: string | null;
  duration_minutes: number;
  created_at: string;
}

/**
 * HabitsScreen: Gestisce la creazione e il monitoraggio delle abitudini giornaliere.
 * Permette di impostare orari specifici e sincronizza i dati con il widget Android.
 */
export default function HabitsScreen() {
  const { theme } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Stati per la pianificazione temporale
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetchHabits();
  }, []);

  /**
   * Recupera la lista delle abitudini dell'utente da Supabase.
   */
  const fetchHabits = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crea una nuova abitudine nel database.
   */
  const addHabit = async () => {
    if (!newHabit.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Formattazione dell'ora per l'archiviazione (HH:MM:SS)
      const timeStr = selectedTime 
        ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}:00`
        : null;

      const { data, error } = await supabase
        .from('habits')
        .insert([
          { 
            title: newHabit, 
            user_id: user.id,
            icon: '✨',
            streak: 0,
            is_completed: false,
            scheduled_time: timeStr,
            duration_minutes: duration
          }
        ])
        .select();

      if (error) throw error;
      
      const updatedHabits = [data[0], ...habits];
      setHabits(updatedHabits);
      syncWidget(updatedHabits); // Aggiorna il widget esterno
      
      setNewHabit('');
      setSelectedTime(null);
      setIsAdding(false);
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    }
  };

  /**
   * Commuta lo stato di completamento di un'abitudine.
   */
  const toggleHabit = async (habit: Habit) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_completed: !habit.is_completed })
        .eq('id', habit.id);

      if (error) throw error;
      
      const updatedHabits = habits.map(h => 
        h.id === habit.id ? { ...h, is_completed: !h.is_completed } : h
      );
      setHabits(updatedHabits);
      syncWidget(updatedHabits);
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    }
  };

  /**
   * Renderizza la singola card dell'abitudine.
   */
  const renderHabit = ({ item }: { item: Habit }) => (
    <TouchableOpacity 
      onPress={() => toggleHabit(item)}
      activeOpacity={0.8}
    >
      <Card style={[styles.habitCard, item.is_completed && { opacity: 0.6, borderColor: theme.colors.border }]}>
        <View style={styles.habitLeft}>
          <View style={[styles.iconContainer, { backgroundColor: item.is_completed ? theme.colors.surface2 : theme.colors.primaryDim }]}>
            <Text style={styles.habitIcon}>{item.icon}</Text>
          </View>
          <View>
            <Text style={[
              styles.habitTitle, 
              { color: theme.colors.text, fontFamily: theme.typography.sans },
              item.is_completed && styles.habitTitleCompleted
            ]}>
              {item.title}
            </Text>
            <View style={styles.habitMeta}>
              {item.scheduled_time && (
                <View style={[styles.timeTag, { backgroundColor: theme.colors.primaryDim }]}>
                  <Feather name="clock" size={12} color={theme.colors.primary} />
                  <Text style={[styles.timeTagText, { color: theme.colors.primary }]}>
                    {item.scheduled_time.substring(0, 5)}
                  </Text>
                </View>
              )}
              <Text style={[styles.streakText, { color: theme.colors.primary }]}>
                🔥 {item.streak}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={[
          styles.checkbox, 
          { borderColor: theme.colors.textMuted },
          item.is_completed && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
        ]}>
          {item.is_completed && <Feather name="check" size={16} color={theme.colors.background} />}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>Abitudini</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.primary, fontFamily: theme.typography.sans }]}>Costruisci la tua routine</Text>
      </View>

      <View style={styles.topInputContainer}>
        {isAdding ? (
          <Card style={[styles.addExpanded, { borderColor: theme.colors.primary }]}>
            <View style={styles.addSection}>
              <TextInput
                style={[styles.input, { color: theme.colors.text, fontFamily: theme.typography.sans }]}
                placeholder="Nome abitudine..."
                placeholderTextColor={theme.colors.textMuted}
                value={newHabit}
                onChangeText={setNewHabit}
                autoFocus
              />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={addHabit}>
                <Feather name="check" size={20} color={theme.colors.background} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                <Feather name="x" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <View style={[styles.timeRow, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[
                  styles.timePickerBtn, 
                  { borderColor: theme.colors.border },
                  selectedTime && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setShowPicker(true)}
              >
                <Feather name="clock" size={18} color={selectedTime ? theme.colors.background : theme.colors.primary} />
                <Text style={[
                  styles.timePickerText, 
                  { color: theme.colors.textMuted },
                  selectedTime && { color: theme.colors.background, fontWeight: 'bold' }
                ]}>
                  {selectedTime ? `${selectedTime.getHours()}:${selectedTime.getMinutes().toString().padStart(2, '0')}` : "Ora"}
                </Text>
              </TouchableOpacity>

              <View style={styles.durationContainer}>
                {[15, 30, 60].map((d) => (
                  <TouchableOpacity 
                    key={d}
                    style={[
                      styles.durationPill, 
                      { backgroundColor: theme.colors.surface2 },
                      duration === d && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[
                      styles.durationPillText, 
                      { color: theme.colors.text },
                      duration === d && { color: theme.colors.background }
                    ]}>{d}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {showPicker && (
              <DateTimePicker
                value={selectedTime || new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (date) setSelectedTime(date);
                }}
              />
            )}
          </Card>
        ) : (
          <TouchableOpacity 
            style={[styles.addPlaceholder, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} 
            onPress={() => setIsAdding(true)}
          >
            <Feather name="plus" size={20} color={theme.colors.primary} />
            <Text style={[styles.addPlaceholderText, { color: theme.colors.textMuted }]}>Aggiungi una nuova abitudine</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabit}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>Ancora nessuna abitudine. Inizia ora!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, marginTop: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  habitLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  habitIcon: { fontSize: 24 },
  habitTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  habitTitleCompleted: { textDecorationLine: 'line-through', opacity: 0.6 },
  streakText: { fontSize: 13, fontWeight: '500' },
  habitMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  timeTagText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  addExpanded: { padding: 10 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePickerText: { marginLeft: 8, fontSize: 14, fontWeight: '500' },
  durationContainer: { flexDirection: 'row', gap: 8 },
  durationPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  durationPillText: { fontSize: 12, fontWeight: '600' },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topInputContainer: { paddingHorizontal: 20, marginBottom: 20 },
  addPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addPlaceholderText: { marginLeft: 10, fontSize: 15, fontWeight: '500' },
  addSection: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 45, paddingHorizontal: 15, fontSize: 15 },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelBtn: { padding: 8, marginLeft: 4 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 120 }
});
