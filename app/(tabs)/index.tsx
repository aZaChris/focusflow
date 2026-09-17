import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSession } from '@/features/auth/hooks/useSession';
import { useHabits } from '@/features/habits/hooks/useHabits';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { useNowMarker } from '@/features/timeline/hooks/useNowMarker';
import { useTodayActivities, type Activity } from '@/features/timeline/hooks/useTodayActivities';
import { timeToPosition } from '@/features/timeline/time';
import { getNowAndNext } from '@/features/timeline/nowNext';
import { activitySchema } from '@/features/timeline/validation/schema';
import { color, spacing, radius, font, fontSize } from '@/theme/tokens';
import { Screen, ScreenTitle, TextField, Button, ErrorText, MutedText, Card, ProgressBar, AvatarInitials, Icon } from '@/components/ui';

const DAY_HEIGHT_PX = 1440; // 1px per minute — plenty of room for 5-min to 8h blocks (SC-005).

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TimelineScreen() {
  const { session } = useSession();
  const { today, nowTime } = useNowMarker();
  const { activities, isLoading, createActivity, updateActivity, deleteActivity } = useTodayActivities(today);
  const { habits } = useHabits();
  const entitlement = useEntitlement();
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [showForm, setShowForm] = useState(false);

  const markerTop = timeToPosition(nowTime, DAY_HEIGHT_PX);
  const { current, next } = getNowAndNext(activities, nowTime);

  const doneToday = habits.filter((h) => h.completed_today).length;
  // Handoff's "{n}-day streak" is a single number — real streaks are per-habit,
  // so this shows the best one running today as a light, non-authoritative vibe
  // indicator, not a combined account-wide metric that doesn't exist.
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.current_streak), 0);
  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? session?.user.email ?? '';

  async function handleAdd() {
    setError(null);
    const parsed = activitySchema.safeParse({ title: title.trim(), startTime, endTime });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the title and times.');
      return;
    }
    const result = await createActivity(parsed.data.title, parsed.data.startTime, parsed.data.endTime);
    if (!result.ok) {
      setError("Couldn't save that activity. Please try again.");
      return;
    }
    setTitle('');
    setStartTime('');
    setEndTime('');
    setShowForm(false);
  }

  function openEdit(activity: Activity) {
    setSelected(activity);
    setTitle(activity.title);
    setStartTime(activity.start_time);
    setEndTime(activity.end_time);
    setError(null);
    setShowForm(true);
  }

  async function handleSaveEdit() {
    if (!selected) return;
    setError(null);
    const parsed = activitySchema.safeParse({ title: title.trim(), startTime, endTime });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the title and times.');
      return;
    }
    const result = await updateActivity(selected.id, {
      title: parsed.data.title,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
    });
    if (!result.ok) {
      setError("Couldn't save that change. Please try again.");
      return;
    }
    cancelEdit();
  }

  async function handleDelete() {
    if (!selected) return;
    const result = await deleteActivity(selected.id);
    if (!result.ok) {
      setError("Couldn't delete that activity. Please try again.");
      return;
    }
    cancelEdit();
  }

  function cancelEdit() {
    setSelected(null);
    setTitle('');
    setStartTime('');
    setEndTime('');
    setError(null);
    setShowForm(false);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <ScreenTitle>{greeting()}</ScreenTitle>
          <MutedText>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</MutedText>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/settings')} accessibilityRole="button" accessibilityLabel="Open settings">
          <AvatarInitials name={name} size={38} />
        </Pressable>
      </View>

      <Card>
        <Text style={styles.focusTitle}>Today's focus</Text>
        <View style={styles.focusRow}>
          <Text style={styles.focusCount}>
            {doneToday} of {habits.length} habits done
          </Text>
          {bestStreak > 0 ? <Text style={styles.streak}>🔥 {bestStreak}-day streak</Text> : null}
        </View>
        <ProgressBar progress={habits.length > 0 ? doneToday / habits.length : 0} />
      </Card>

      {!entitlement.isLoading && !entitlement.isActive ? (
        <Pressable style={styles.upgradeBanner} onPress={() => router.push('/subscription')} accessibilityRole="button" accessibilityLabel="Upgrade to FocusFlow Pro">
          <View>
            <Text style={styles.upgradeEyebrow}>Unlock deeper insights</Text>
            <Text style={styles.upgradeTitle}>Upgrade to FocusFlow Pro</Text>
          </View>
          <Icon name="chevronRight" color={color.onPrimary} size={20} />
        </Pressable>
      ) : null}

      <View style={styles.nowNext}>
        <Text style={styles.nowNextText}>Now: {current ? current.title : 'Nothing scheduled'}</Text>
        <Text style={styles.nowNextText}>Next: {next ? `${next.title} (${next.start_time})` : 'Nothing else today'}</Text>
      </View>

      {showForm ? (
        <View style={styles.form}>
          <TextField placeholder="Activity title" accessibilityLabel="Activity title" value={title} onChangeText={setTitle} />
          <View style={styles.timeRow}>
            <TextField style={styles.timeInput} placeholder="Start (HH:MM)" accessibilityLabel="Start time" value={startTime} onChangeText={setStartTime} />
            <TextField style={styles.timeInput} placeholder="End (HH:MM)" accessibilityLabel="End time" value={endTime} onChangeText={setEndTime} />
          </View>
          <View style={styles.timeRow}>
            <Button style={styles.flexButton} title={selected ? 'Save' : 'Add'} onPress={selected ? handleSaveEdit : handleAdd} accessibilityLabel={selected ? 'Save changes' : 'Add activity'} />
            {selected ? (
              <Button style={styles.flexButton} title="Delete" variant="destructive" onPress={handleDelete} accessibilityLabel={`Delete ${selected.title}`} />
            ) : null}
            <Button style={styles.flexButton} title="Cancel" variant="secondary" onPress={cancelEdit} accessibilityLabel="Cancel" />
          </View>
          {error ? <ErrorText>{error}</ErrorText> : null}
        </View>
      ) : (
        <Button title="Add activity" variant="secondary" onPress={() => setShowForm(true)} accessibilityLabel="Add activity" />
      )}

      <ScrollView contentContainerStyle={{ height: DAY_HEIGHT_PX }}>
        <View style={styles.timeline}>
          <View style={[styles.marker, { top: markerTop }]} accessibilityLabel={`Current time ${nowTime}`}>
            <Text style={styles.markerLabel}>{nowTime}</Text>
          </View>
          {activities.map((activity) => {
            const top = timeToPosition(activity.start_time, DAY_HEIGHT_PX);
            const bottom = timeToPosition(activity.end_time, DAY_HEIGHT_PX);
            return (
              <Pressable
                key={activity.id}
                style={[styles.block, { top, height: Math.max(bottom - top, 20) }]}
                onPress={() => openEdit(activity)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`${activity.title}, ${activity.start_time} to ${activity.end_time}. Tap to edit.`}
              >
                <Text style={styles.blockTitle} numberOfLines={1}>
                  {activity.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {!isLoading && activities.length === 0 ? (
        <MutedText style={styles.empty}>Nothing scheduled yet — add your first activity to see it here.</MutedText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusTitle: { fontSize: fontSize.base, fontFamily: font.semibold, color: color.text },
  focusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  focusCount: { color: color.textSecondary, fontFamily: font.regular },
  streak: { color: color.textMuted, fontSize: fontSize.sm, fontFamily: font.regular },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.upgradeCard,
    borderRadius: radius.lg,
    padding: 18,
  },
  upgradeEyebrow: { color: color.textMuted, fontSize: fontSize.sm, fontFamily: font.regular },
  upgradeTitle: { color: color.onPrimary, fontFamily: font.bold, fontSize: fontSize.base, marginTop: 2 },
  nowNext: { gap: 2 },
  nowNextText: { color: color.textSecondary, fontFamily: font.regular },
  form: { gap: spacing.sm },
  timeRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  timeInput: { flex: 1 },
  flexButton: { flex: 1 },
  timeline: { flex: 1, position: 'relative', borderLeftWidth: 2, borderLeftColor: color.divider, marginLeft: spacing.sm },
  marker: { position: 'absolute', left: -8, right: 0, height: 2, backgroundColor: color.error, flexDirection: 'row', alignItems: 'center' },
  markerLabel: { color: color.error, fontFamily: font.semibold, marginLeft: spacing.md, backgroundColor: color.background },
  block: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: color.primary,
    borderRadius: radius.sm,
    padding: 6,
    justifyContent: 'center',
  },
  blockTitle: { color: color.onPrimary, fontFamily: font.semibold },
  empty: { textAlign: 'center' },
});
