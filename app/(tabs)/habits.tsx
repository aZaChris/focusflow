import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface Habit {
  id: string;
  title: string;
  icon: string;
  streak: number;
  is_completed: boolean;
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [loading, setLoading] = useState(true);

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
        .order('created_at', { ascending: true });

      if (error) throw error;
      setHabits(data || []);
    } catch (error: any) {
      Alert.alert('Errore', 'Impossibile caricare le abitudini: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habit: Habit) => {
    const newStatus = !habit.is_completed;
    const newStreak = newStatus ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    // Update locale per reattività immediata
    setHabits(current => 
      current.map(h => h.id === habit.id ? { ...h, is_completed: newStatus, streak: newStreak } : h)
    );

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_completed: newStatus, streak: newStreak })
        .eq('id', habit.id);

      if (error) throw error;
    } catch (error: any) {
      // Rollback in caso di errore
      fetchHabits();
      Alert.alert('Errore', 'Impossibile aggiornare l\'abitudine');
    }
  };

  const addNewHabit = async () => {
    if (newHabitTitle.trim() === '') {
      setIsAdding(false);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const newHabit = {
        user_id: user.id,
        title: newHabitTitle.trim(),
        icon: '✨',
        streak: 0,
        is_completed: false
      };

      const { data, error } = await supabase
        .from('habits')
        .insert([newHabit])
        .select();

      if (error) throw error;

      if (data) {
        setHabits([...habits, data[0]]);
        setNewHabitTitle('');
        setIsAdding(false);
      }
    } catch (error: any) {
      Alert.alert('Errore', 'Impossibile creare l\'abitudine: ' + error.message);
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
          <Text style={styles.streakText}>
            🔥 {item.streak} {item.streak === 1 ? 'giorno' : 'giorni'} di fila
          </Text>
        </View>
      </View>
      
      <View style={[styles.checkbox, item.is_completed && styles.checkboxChecked]}>
        {item.is_completed && <Feather name="check" size={16} color={colors.bg} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Le tue Abitudini</Text>
        <Text style={styles.headerSubtitle}>Costruisci la tua routine ideale giorno per giorno.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={item => item.id}
          renderItem={renderHabit}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Ancora nessuna abitudine. Inizia ora!</Text>
          }
        />
      )}

      {isAdding ? (
        <View style={styles.addSection}>
          <TextInput
            style={styles.input}
            placeholder="Es. Fare stretching, Meditare..."
            placeholderTextColor={colors.muted}
            value={newHabitTitle}
            onChangeText={setNewHabitTitle}
            autoFocus
            onSubmitEditing={addNewHabit}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={addNewHabit}>
            <Feather name="check" size={24} color={colors.bg} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={() => setIsAdding(true)}>
          <Feather name="plus" size={24} color={colors.bg} />
          <Text style={styles.fabText}>Nuova Abitudine</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: {
    color: colors.bg,
    fontFamily: typography.sans,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  addSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: colors.surface2,
    borderRadius: 15,
    paddingHorizontal: 20,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    width: 50,
    height: 50,
    backgroundColor: colors.activities.teal,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  }
});
