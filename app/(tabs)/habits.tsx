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
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { colors, typography } from '../../constants/theme';
import { Feather } from '@expo/vector-icons';
import { syncWidget } from '../../lib/widgetSync';

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

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Stati per il tempo
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetchHabits();
  }, []);

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

  const addHabit = async () => {
    if (!newHabit.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Formattiamo l'ora per Postgres (HH:MM:SS)
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
      syncWidget(updatedHabits); // Sincronizza widget
      setNewHabit('');
      setSelectedTime(null);
      setIsAdding(false);
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    }
  };

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
      syncWidget(updatedHabits); // Sincronizza widget
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    }
  };

  const renderHabit = ({ item }: { item: Habit }) => (
    <TouchableOpacity 
      style={[styles.habitCard, item.is_completed && styles.habitCardCompleted]} 
      onPress={() => toggleHabit(item)}
      activeOpacity={0.8}
    >
      <View style={styles.habitLeft}>
        <View style={[styles.iconContainer, item.is_completed && styles.iconContainerCompleted]}>
          <Text style={styles.habitIcon}>{item.icon}</Text>
        </View>
        <View>
          <Text style={[styles.habitTitle, item.is_completed && styles.habitTitleCompleted]}>
            {item.title}
          </Text>
          <View style={styles.habitMeta}>
            {item.scheduled_time && (
              <View style={styles.timeTag}>
                <Feather name="clock" size={12} color={colors.accent} />
                <Text style={styles.timeTagText}>{item.scheduled_time.substring(0, 5)}</Text>
              </View>
            )}
            <Text style={styles.streakText}>
              🔥 {item.streak}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}>
        {item.is_completed && <Feather name="check" size={16} color={colors.bg} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abitudini</Text>
        <Text style={styles.headerSubtitle}>Costruisci la tua routine</Text>
      </View>

      <View style={styles.topInputContainer}>
        {isAdding ? (
          <View style={styles.addExpanded}>
            <View style={styles.addSection}>
              <TextInput
                style={styles.input}
                placeholder="Nome abitudine..."
                placeholderTextColor={colors.muted}
                value={newHabit}
                onChangeText={setNewHabit}
                autoFocus
              />
              <TouchableOpacity style={styles.saveBtn} onPress={addHabit}>
                <Feather name="check" size={20} color={colors.bg} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                <Feather name="x" size={20} color={colors.activities.red} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeRow}>
              <TouchableOpacity 
                style={[styles.timePickerBtn, selectedTime && styles.timePickerBtnActive]}
                onPress={() => setShowPicker(true)}
              >
                <Feather name="clock" size={18} color={selectedTime ? colors.bg : colors.accent} />
                <Text style={[styles.timePickerText, selectedTime && styles.timePickerTextActive]}>
                  {selectedTime ? `${selectedTime.getHours()}:${selectedTime.getMinutes().toString().padStart(2, '0')}` : "Imposta orario"}
                </Text>
              </TouchableOpacity>

              <View style={styles.durationContainer}>
                {[15, 30, 60].map((d) => (
                  <TouchableOpacity 
                    key={d}
                    style={[styles.durationPill, duration === d && styles.durationPillActive]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[styles.durationPillText, duration === d && styles.durationPillTextActive]}>{d}m</Text>
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
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addPlaceholder} 
            onPress={() => setIsAdding(true)}
          >
            <Feather name="plus" size={20} color={colors.accent} />
            <Text style={styles.addPlaceholderText}>Aggiungi una nuova abitudine</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabit}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Ancora nessuna abitudine. Inizia ora!</Text>
          }
        />
      )}
    </View>
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
  headerTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.activities.teal,
    fontFamily: typography.sans,
    fontSize: 16,
    marginTop: 5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitCardCompleted: {
    borderColor: colors.activities.teal + '44',
    backgroundColor: colors.bg, 
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  iconContainerCompleted: {
    backgroundColor: colors.activities.teal + '22',
  },
  habitIcon: {
    fontSize: 24,
  },
  habitTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitTitleCompleted: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  streakText: {
    color: colors.accent,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: '500',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 240, 74, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  timeTagText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  addExpanded: {
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timePickerText: {
    color: colors.muted,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  timePickerTextActive: {
    color: colors.bg,
    fontWeight: 'bold',
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface2,
  },
  durationPillActive: {
    backgroundColor: colors.activities.teal,
  },
  durationPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  durationPillTextActive: {
    color: colors.bg,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.activities.teal,
    borderColor: colors.activities.teal,
  },
  topInputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addPlaceholderText: {
    color: colors.muted,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  addSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  input: {
    flex: 1,
    height: 45,
    paddingHorizontal: 15,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
  },
  saveBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelBtn: {
    padding: 8,
    marginLeft: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Più spazio per la floating nav bar
  }
});
