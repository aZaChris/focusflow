import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useHabits } from '@/features/habits/hooks/useHabits';
import { useHabitCompletion } from '@/features/habits/hooks/useHabitCompletion';
import { useHabitHistory } from '@/features/habits/hooks/useHabitHistory';
import { habitTitleSchema } from '@/features/habits/validation/schema';

// User Story 3: last-7-days completion history for one habit, shown when expanded.
function HabitHistory({ habitId, asOf }: { habitId: string; asOf: string }) {
  const { completedDays, isLoading } = useHabitHistory(habitId, asOf);
  if (isLoading) return null;
  return (
    <View style={styles.historyRow}>
      {completedDays.length === 0 ? (
        <Text style={styles.historyEmpty}>No completions in the last 7 days.</Text>
      ) : (
        <Text style={styles.historyText}>Completed: {completedDays.join(', ')}</Text>
      )}
    </View>
  );
}

export default function HabitsScreen() {
  const { habits, isLoading, refresh, createHabit, archiveHabit, todayLocalDate } = useHabits();
  const { complete, undo } = useHabitCompletion();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    const parsed = habitTitleSchema.safeParse(title.trim());
    if (!parsed.success) {
      setError('Give your habit a short name.');
      return;
    }
    const result = await createHabit(parsed.data);
    if (!result.ok) {
      setError("Couldn't save that habit. Please try again.");
      return;
    }
    setTitle('');
  }

  async function handleToggle(habitId: string, completedToday: boolean) {
    const today = todayLocalDate();
    // FR-002: idempotent per day — toggling just reflects the current state back.
    if (completedToday) await undo(habitId, today);
    else await complete(habitId, today);
    await refresh();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits</Text>

      <View style={styles.createRow}>
        <TextInput
          style={styles.input}
          placeholder="New habit"
          accessibilityLabel="New habit title"
          value={title}
          onChangeText={setTitle}
        />
        <Pressable
          style={styles.button}
          onPress={handleCreate}
          accessibilityRole="button"
          accessibilityLabel="Add habit"
        >
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {!isLoading && habits.length === 0 ? (
        <Text style={styles.empty}>No habits yet — add one above to get started.</Text>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <View style={styles.row}>
                <Pressable
                  style={[styles.checkbox, item.completed_today && styles.checkboxDone]}
                  onPress={() => handleToggle(item.id, item.completed_today)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed_today }}
                  accessibilityLabel={`Mark ${item.title} ${item.completed_today ? 'not done' : 'done'} today`}
                />
                <Pressable
                  style={styles.rowText}
                  onPress={() => setExpandedHabitId(expandedHabitId === item.id ? null : item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show history for ${item.title}`}
                >
                  <Text style={styles.habitTitle}>{item.title}</Text>
                  <Text style={styles.streak}>
                    🔥 {item.current_streak} day streak · best {item.longest_streak}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.archiveButton}
                  onPress={() => archiveHabit(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Archive ${item.title}`}
                >
                  <Text style={styles.archive}>Archive</Text>
                </Pressable>
              </View>
              {expandedHabitId === item.id ? (
                <HabitHistory habitId={item.id} asOf={todayLocalDate()} />
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  createRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  button: { backgroundColor: '#111', borderRadius: 8, padding: 12, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c00' },
  empty: { color: '#666', marginTop: 24, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  // 44x44 minimum tap target (Principle V) — visually a ring, not just the 28px dot.
  checkbox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#111' },
  rowText: { flex: 1 },
  habitTitle: { fontSize: 16, fontWeight: '600' },
  streak: { color: '#666', marginTop: 2 },
  archiveButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  archive: { color: '#900' },
  historyRow: { paddingBottom: 12, paddingLeft: 40 },
  historyText: { color: '#333' },
  historyEmpty: { color: '#666', fontStyle: 'italic' },
});
