import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useHabits } from '@/features/habits/hooks/useHabits';
import { useHabitCompletion } from '@/features/habits/hooks/useHabitCompletion';
import { useHabitHistory } from '@/features/habits/hooks/useHabitHistory';
import { habitTitleSchema } from '@/features/habits/validation/schema';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

// User Story 3: last-7-days completion history for one habit, shown when expanded.
function HabitHistory({ habitId, asOf, s }: { habitId: string; asOf: string; s: ReturnType<typeof makeStyles> }) {
  const { completedDays, isLoading } = useHabitHistory(habitId, asOf);
  if (isLoading) return null;
  return (
    <View style={s.historyRow}>
      {completedDays.length === 0 ? (
        <Text style={s.historyEmpty}>No completions in the last 7 days.</Text>
      ) : (
        <Text style={s.historyText}>Completed: {completedDays.join(', ')}</Text>
      )}
    </View>
  );
}

export default function HabitsScreen() {
  const { theme } = useTheme();
  const { habits, isLoading, refresh, createHabit, archiveHabit, todayLocalDate } = useHabits();
  const { complete, undo } = useHabitCompletion();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const s = makeStyles(theme);

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
    if (completedToday) await undo(habitId, today);
    else await complete(habitId, today);
    await refresh();
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Habits</Text>

      <View style={s.createRow}>
        <TextInput
          style={s.input}
          placeholder="New habit"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="New habit title"
          value={title}
          onChangeText={setTitle}
        />
        <Pressable style={s.button} onPress={handleCreate} accessibilityRole="button" accessibilityLabel="Add habit">
          <Text style={s.buttonText}>Add</Text>
        </Pressable>
      </View>
      {error ? (
        <Text style={s.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {!isLoading && habits.length === 0 ? (
        <Text style={s.empty}>No habits yet — add one above to get started.</Text>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.row}>
                <Pressable
                  style={[s.checkbox, item.completed_today && s.checkboxDone]}
                  onPress={() => handleToggle(item.id, item.completed_today)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed_today }}
                  accessibilityLabel={`Mark ${item.title} ${item.completed_today ? 'not done' : 'done'} today`}
                >
                  {item.completed_today ? <Text style={s.checkboxMark}>✓</Text> : null}
                </Pressable>
                <Pressable
                  style={s.rowText}
                  onPress={() => setExpandedHabitId(expandedHabitId === item.id ? null : item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show history for ${item.title}`}
                >
                  <Text style={s.habitTitle}>{item.title}</Text>
                  <Text style={s.streak}>· streak {item.current_streak}d · best {item.longest_streak}d</Text>
                </Pressable>
                <Pressable style={s.archiveButton} onPress={() => archiveHabit(item.id)} accessibilityRole="button" accessibilityLabel={`Archive ${item.title}`}>
                  <Text style={s.archive}>Archive</Text>
                </Pressable>
              </View>
              {expandedHabitId === item.id ? <HabitHistory habitId={item.id} asOf={todayLocalDate()} s={s} /> : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: spacing.screenX, gap: 12, backgroundColor: theme.background },
    title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
    createRow: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: radii.input, padding: 12, color: theme.textPrimary, backgroundColor: theme.surface },
    button: { backgroundColor: theme.primary, borderRadius: radii.input, padding: 12, justifyContent: 'center' },
    buttonText: { color: theme.surface, fontWeight: '600' },
    error: { color: theme.error },
    empty: { color: theme.textMuted, marginTop: 24, textAlign: 'center' },
    card: { backgroundColor: theme.surface, borderRadius: radii.card - 4, borderWidth: 1, borderColor: theme.border, padding: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    checkboxDone: { backgroundColor: theme.primary, borderColor: theme.primary },
    checkboxMark: { color: theme.surface, fontWeight: '700', fontSize: 14 },
    rowText: { flex: 1 },
    habitTitle: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
    streak: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
    archiveButton: { minHeight: 32, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
    archive: { color: theme.error, fontSize: 12 },
    historyRow: { paddingTop: 8, paddingLeft: 38 },
    historyText: { color: theme.textSecondary, fontSize: 12 },
    historyEmpty: { color: theme.textMuted, fontStyle: 'italic', fontSize: 12 },
  });
}
