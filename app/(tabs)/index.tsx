import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useNowMarker } from '@/features/timeline/hooks/useNowMarker';
import { useTodayActivities, type Activity } from '@/features/timeline/hooks/useTodayActivities';
import { timeToPosition } from '@/features/timeline/time';
import { getNowAndNext } from '@/features/timeline/nowNext';
import { activitySchema } from '@/features/timeline/validation/schema';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

const DAY_HEIGHT_PX = 1440; // 1px per minute — plenty of room for 5-min to 8h blocks (SC-005).

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TimelineScreen() {
  const { theme } = useTheme();
  const { today, nowTime } = useNowMarker();
  const { activities, isLoading, createActivity, updateActivity, deleteActivity } = useTodayActivities(today);
  const entitlement = useEntitlement();
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Activity | null>(null);

  const markerTop = timeToPosition(nowTime, DAY_HEIGHT_PX);
  const { current, next } = getNowAndNext(activities, nowTime);
  const doneCount = activities.filter((a) => a.end_time <= nowTime).length;

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
  }

  function openEdit(activity: Activity) {
    setSelected(activity);
    setTitle(activity.title);
    setStartTime(activity.start_time);
    setEndTime(activity.end_time);
    setError(null);
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
    setSelected(null);
    setTitle('');
    setStartTime('');
    setEndTime('');
  }

  async function handleDelete() {
    if (!selected) return;
    const result = await deleteActivity(selected.id);
    if (!result.ok) {
      setError("Couldn't delete that activity. Please try again.");
      return;
    }
    setSelected(null);
    setTitle('');
    setStartTime('');
    setEndTime('');
  }

  function cancelEdit() {
    setSelected(null);
    setTitle('');
    setStartTime('');
    setEndTime('');
    setError(null);
  }

  const s = makeStyles(theme);
  const total = activities.length;
  const progress = total === 0 ? 0 : doneCount / total;

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.greeting}>{greeting()}</Text>
          <Text style={s.date}>{today}</Text>
        </View>
        <Pressable style={s.avatar} onPress={() => router.push('/(tabs)/settings')} accessibilityRole="button" accessibilityLabel="Settings">
          <Text style={s.avatarText}>{current?.title?.[0]?.toUpperCase() ?? '·'}</Text>
        </Pressable>
      </View>

      {total > 0 && (
        <View style={s.focusCard}>
          <Text style={s.focusText}>
            {doneCount} of {total} today done
          </Text>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      )}

      {!entitlement.isActive && (
        <Pressable style={s.upgradeBanner} onPress={() => router.push('/(tabs)/subscription')} accessibilityRole="button">
          <Text style={s.upgradeTitle}>Unlock deeper insights</Text>
          <Text style={s.upgradeSubtitle}>Upgrade to Foxus Pro ›</Text>
        </Pressable>
      )}

      <View style={s.nowNext}>
        <Text style={s.nowNextText}>Now: {current ? current.title : 'Nothing scheduled'}</Text>
        <Text style={s.nowNextText}>Next: {next ? `${next.title} (${next.start_time})` : 'Nothing else today'}</Text>
      </View>

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Activity title"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Activity title"
          value={title}
          onChangeText={setTitle}
        />
        <View style={s.timeRow}>
          <TextInput
            style={[s.input, s.timeInput]}
            placeholder="Start (HH:MM)"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="Start time"
            value={startTime}
            onChangeText={setStartTime}
          />
          <TextInput
            style={[s.input, s.timeInput]}
            placeholder="End (HH:MM)"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="End time"
            value={endTime}
            onChangeText={setEndTime}
          />
          <Pressable style={s.button} onPress={selected ? handleSaveEdit : handleAdd} accessibilityRole="button" accessibilityLabel={selected ? 'Save changes' : 'Add activity'}>
            <Text style={s.buttonText}>{selected ? 'Save' : 'Add'}</Text>
          </Pressable>
        </View>
        {selected ? (
          <View style={s.timeRow}>
            <Pressable style={s.deleteButton} onPress={handleDelete} accessibilityRole="button" accessibilityLabel={`Delete ${selected.title}`}>
              <Text style={s.buttonText}>Delete</Text>
            </Pressable>
            <Pressable style={s.button} onPress={cancelEdit} accessibilityRole="button" accessibilityLabel="Cancel editing">
              <Text style={s.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
        {error ? (
          <Text style={s.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ height: DAY_HEIGHT_PX }}>
        <View style={s.timeline}>
          <View style={[s.marker, { top: markerTop }]} accessibilityLabel={`Current time ${nowTime}`}>
            <Text style={s.markerLabel}>{nowTime}</Text>
          </View>
          {activities.map((activity) => {
            const top = timeToPosition(activity.start_time, DAY_HEIGHT_PX);
            const bottom = timeToPosition(activity.end_time, DAY_HEIGHT_PX);
            return (
              <Pressable
                key={activity.id}
                style={[s.block, { top, height: Math.max(bottom - top, 20) }]}
                onPress={() => openEdit(activity)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`${activity.title}, ${activity.start_time} to ${activity.end_time}. Tap to edit.`}
              >
                <Text style={s.blockTitle} numberOfLines={1}>
                  {activity.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {!isLoading && activities.length === 0 ? (
        <Text style={s.empty}>Nothing scheduled yet — add your first activity to see it here.</Text>
      ) : null}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: spacing.screenX, gap: 12, backgroundColor: theme.background },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
    date: { fontSize: 13, color: theme.textSecondary },
    avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: theme.primary, fontWeight: '700' },
    focusCard: {
      backgroundColor: theme.surface,
      borderRadius: radii.card,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 10,
    },
    focusText: { color: theme.textPrimary, fontWeight: '600' },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: theme.surfaceAlt, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.primary },
    upgradeBanner: { backgroundColor: theme.darkSurface, borderRadius: 18, padding: 16, gap: 2 },
    upgradeTitle: { color: '#fff', fontWeight: '700' },
    upgradeSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    nowNext: { gap: 2 },
    nowNextText: { color: theme.textSecondary },
    form: { gap: 8 },
    deleteButton: { backgroundColor: theme.error, borderRadius: radii.input, padding: 12, justifyContent: 'center' },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: radii.input, padding: 12, color: theme.textPrimary, backgroundColor: theme.surface },
    timeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    timeInput: { flex: 1 },
    button: { backgroundColor: theme.primary, borderRadius: radii.input, padding: 12, justifyContent: 'center' },
    buttonText: { color: theme.surface, fontWeight: '600' },
    error: { color: theme.error },
    timeline: { flex: 1, position: 'relative', borderLeftWidth: 2, borderLeftColor: theme.border, marginLeft: 8 },
    marker: { position: 'absolute', left: -8, right: 0, height: 2, backgroundColor: theme.error, flexDirection: 'row', alignItems: 'center' },
    markerLabel: { color: theme.error, fontWeight: '600', marginLeft: 12, backgroundColor: theme.background },
    block: {
      position: 'absolute',
      left: 12,
      right: 12,
      backgroundColor: theme.primary,
      borderRadius: 6,
      padding: 6,
      justifyContent: 'center',
    },
    blockTitle: { color: theme.surface, fontWeight: '600' },
    empty: { color: theme.textMuted, textAlign: 'center' },
  });
}
