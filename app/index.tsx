import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNowMarker } from '@/features/timeline/hooks/useNowMarker';
import { useTodayActivities, type Activity } from '@/features/timeline/hooks/useTodayActivities';
import { timeToPosition } from '@/features/timeline/time';
import { getNowAndNext } from '@/features/timeline/nowNext';
import { activitySchema } from '@/features/timeline/validation/schema';

const DAY_HEIGHT_PX = 1440; // 1px per minute — plenty of room for 5-min to 8h blocks (SC-005).

export default function TimelineScreen() {
  const { today, nowTime } = useNowMarker();
  const { activities, isLoading, createActivity, updateActivity, deleteActivity } = useTodayActivities(today);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Activity | null>(null);

  const markerTop = timeToPosition(nowTime, DAY_HEIGHT_PX);
  const { current, next } = getNowAndNext(activities, nowTime);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>

      <View style={styles.nowNext}>
        <Text style={styles.nowNextText}>Now: {current ? current.title : 'Nothing scheduled'}</Text>
        <Text style={styles.nowNextText}>Next: {next ? `${next.title} (${next.start_time})` : 'Nothing else today'}</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Activity title"
          accessibilityLabel="Activity title"
          value={title}
          onChangeText={setTitle}
        />
        <View style={styles.timeRow}>
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="Start (HH:MM)"
            accessibilityLabel="Start time"
            value={startTime}
            onChangeText={setStartTime}
          />
          <TextInput
            style={[styles.input, styles.timeInput]}
            placeholder="End (HH:MM)"
            accessibilityLabel="End time"
            value={endTime}
            onChangeText={setEndTime}
          />
          <Pressable
            style={styles.button}
            onPress={selected ? handleSaveEdit : handleAdd}
            accessibilityRole="button"
            accessibilityLabel={selected ? 'Save changes' : 'Add activity'}
          >
            <Text style={styles.buttonText}>{selected ? 'Save' : 'Add'}</Text>
          </Pressable>
        </View>
        {selected ? (
          <View style={styles.timeRow}>
            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${selected.title}`}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={cancelEdit}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>

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
                // Short activities render only a few px tall (proportional to their
                // real duration, by design) — hitSlop keeps them comfortably
                // tappable without inflating the visual block itself.
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
        <Text style={styles.empty}>Nothing scheduled yet — add your first activity to see it here.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  nowNext: { gap: 2 },
  nowNextText: { color: '#333' },
  form: { gap: 8 },
  deleteButton: { backgroundColor: '#900', borderRadius: 8, padding: 12, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  timeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  timeInput: { flex: 1 },
  button: { backgroundColor: '#111', borderRadius: 8, padding: 12, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c00' },
  timeline: { flex: 1, position: 'relative', borderLeftWidth: 2, borderLeftColor: '#ddd', marginLeft: 8 },
  marker: { position: 'absolute', left: -8, right: 0, height: 2, backgroundColor: '#c00', flexDirection: 'row', alignItems: 'center' },
  markerLabel: { color: '#c00', fontWeight: '600', marginLeft: 12, backgroundColor: '#fff' },
  block: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#111',
    borderRadius: 6,
    padding: 6,
    justifyContent: 'center',
  },
  blockTitle: { color: '#fff', fontWeight: '600' },
  empty: { color: '#666', textAlign: 'center' },
});
