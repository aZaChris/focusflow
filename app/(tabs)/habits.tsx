import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useHabits } from '@/features/habits/hooks/useHabits';
import { useHabitCompletion } from '@/features/habits/hooks/useHabitCompletion';
import { useHabitHistory } from '@/features/habits/hooks/useHabitHistory';
import { useWeeklyConsistency } from '@/features/habits/hooks/useWeeklyConsistency';
import { habitTitleSchema } from '@/features/habits/validation/schema';
import { color, spacing, radius, font, fontSize } from '@/theme/tokens';
import { Screen, ScreenTitle, TextField, Button, ErrorText, MutedText, Card } from '@/components/ui';

const CHART_HEIGHT = 80;
const BAR_WIDTH = 20;

// Prototype: "7 vertical bars (height % = consistency), current day
// highlighted, others a light chart-muted tone, day labels below."
function WeeklyConsistencyChart({ days, totalHabits }: { days: { date: string; completedCount: number }[]; totalHabits: number }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  return (
    <View>
      <View style={styles.chartRow}>
        {days.map((day) => {
          const fraction = totalHabits > 0 ? day.completedCount / totalHabits : 0;
          const barHeight = Math.max(4, fraction * CHART_HEIGHT);
          const isToday = day.date === todayStr;
          return (
            <Svg key={day.date} width={BAR_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${BAR_WIDTH} ${CHART_HEIGHT}`}>
              <Rect x={0} y={CHART_HEIGHT - barHeight} width={BAR_WIDTH} height={barHeight} rx={6} fill={isToday ? color.primary : color.chartMuted} />
            </Svg>
          );
        })}
      </View>
      <View style={styles.chartLabelRow}>
        {days.map((day) => (
          <Text key={day.date} style={styles.chartLabel}>
            {new Date(day.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
          </Text>
        ))}
      </View>
    </View>
  );
}

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
  const { days: weeklyDays } = useWeeklyConsistency(
    habits.map((h) => h.id),
    todayLocalDate(),
  );
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(false);
  }

  async function handleToggle(habitId: string, completedToday: boolean) {
    const today = todayLocalDate();
    // FR-002: idempotent per day — toggling just reflects the current state back.
    if (completedToday) await undo(habitId, today);
    else await complete(habitId, today);
    await refresh();
  }

  return (
    <Screen>
      <ScreenTitle>Habits</ScreenTitle>

      {habits.length > 0 ? (
        <Card>
          <Text style={styles.chartTitle}>Weekly consistency</Text>
          <WeeklyConsistencyChart days={weeklyDays} totalHabits={habits.length} />
        </Card>
      ) : null}

      {showForm ? (
        <View style={styles.createRow}>
          <TextField style={styles.input} placeholder="New habit" accessibilityLabel="New habit title" value={title} onChangeText={setTitle} />
          <Button title="Add" onPress={handleCreate} />
        </View>
      ) : (
        <Button title="Add habit" variant="secondary" onPress={() => setShowForm(true)} accessibilityLabel="Add habit" />
      )}
      {error ? <ErrorText>{error}</ErrorText> : null}

      {!isLoading && habits.length === 0 ? (
        <MutedText style={styles.empty}>No habits yet — add one above to get started.</MutedText>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <View style={styles.row}>
                <Pressable
                  style={styles.rowText}
                  onPress={() => setExpandedHabitId(expandedHabitId === item.id ? null : item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show history for ${item.title}`}
                >
                  <Text style={styles.habitTitle}>{item.title}</Text>
                  <Text style={styles.streak}>
                    🔥 streak {item.current_streak}d · best {item.longest_streak}d
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.checkbox, item.completed_today && styles.checkboxDone]}
                  onPress={() => handleToggle(item.id, item.completed_today)}
                  // Handoff's circle is 26px, but Principle V requires a 44x44
                  // minimum tap target — hitSlop keeps both true, same pattern
                  // as Today's timeline blocks.
                  hitSlop={{ top: 9, bottom: 9, left: 9, right: 9 }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed_today }}
                  accessibilityLabel={`Mark ${item.title} ${item.completed_today ? 'not done' : 'done'} today`}
                />
                <Pressable
                  style={styles.archiveButton}
                  onPress={() => archiveHabit(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Archive ${item.title}`}
                >
                  <Text style={styles.archive}>Archive</Text>
                </Pressable>
              </View>
              {expandedHabitId === item.id ? <HabitHistory habitId={item.id} asOf={todayLocalDate()} /> : null}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chartTitle: { fontSize: fontSize.base, fontFamily: font.semibold, color: color.text },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chartLabel: { width: BAR_WIDTH, textAlign: 'center', fontSize: fontSize.sm, color: color.textMuted, fontFamily: font.regular },
  createRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1 },
  empty: { marginTop: spacing.xl, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: color.borderLight },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.circleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: color.primary, borderColor: color.primary, borderWidth: 1 },
  rowText: { flex: 1 },
  habitTitle: { fontSize: fontSize.base, fontFamily: font.semibold, color: color.text },
  streak: { color: color.textMuted, marginTop: 2, fontSize: fontSize.sm, fontFamily: font.regular },
  archiveButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  archive: { color: color.destructive, fontFamily: font.regular },
  historyRow: { paddingBottom: spacing.md, paddingLeft: 40 },
  historyText: { color: color.textSecondary, fontFamily: font.regular },
  historyEmpty: { color: color.textMuted, fontStyle: 'italic', fontFamily: font.regular },
});
