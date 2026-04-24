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

interface Habit {
  id: string;
  title: string;
  icon: string;
  streak: number;
  is_completed: boolean;
  created_at: string;
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabit, setNewHabit] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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
        .order('created_at', { ascending: false });

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

      const { data, error } = await supabase
        .from('habits')
        .insert([
          { 
            title: newHabit, 
            user_id: user.id,
            icon: '✨',
            streak: 0,
            is_completed: false
          }
        ])
        .select();

      if (error) throw error;
      
      setHabits([data[0], ...habits]);
      setNewHabit('');
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
      
      setHabits(habits.map(h => 
        h.id === habit.id ? { ...h, is_completed: !h.is_completed } : h
      ));
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Abitudini</Text>
        <Text style={styles.headerSubtitle}>Costruisci la tua routine</Text>
      </View>

      <View style={styles.topInputContainer}>
        {isAdding ? (
          <View style={styles.addSection}>
            <TextInput
              style={styles.input}
              placeholder="Esempio: Meditazione"
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
