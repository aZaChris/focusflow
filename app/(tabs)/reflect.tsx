import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { useMoodConsent } from '@/features/mood/hooks/useMoodConsent';
import { useMoodEntries } from '@/features/mood/hooks/useMoodEntries';
import { useJournalConsent } from '@/features/journal/hooks/useJournalConsent';
import { useJournalRecorder } from '@/features/journal/hooks/useJournalRecorder';
import { useJournalEntries, type JournalEntry } from '@/features/journal/hooks/useJournalEntries';
import { color, spacing, radius, font, fontSize } from '@/theme/tokens';
import { Screen, ScreenTitle, Button, Card, ErrorText, MutedText, SegmentedControl, Icon } from '@/components/ui';

const MOOD_LEVELS = [
  { level: 1, label: 'Low' },
  { level: 2, label: 'Mellow' },
  { level: 3, label: 'Balanced' },
  { level: 4, label: 'Good' },
  { level: 5, label: 'Great' },
];

const CHART_WIDTH = 280;
const CHART_HEIGHT = 90;

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function MoodWeekChart({ entries }: { entries: { mood_level: number; created_at: string }[] }) {
  const days = lastNDays(7);
  const todayStr = days[days.length - 1];
  // Latest entry per day (entries are already newest-first).
  const byDay = new Map<string, number>();
  for (const entry of entries) {
    const day = entry.created_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, entry.mood_level);
  }

  const stepX = CHART_WIDTH / (days.length - 1);
  const points = days
    .map((day, i) => {
      const level = byDay.get(day);
      if (level === undefined) return null;
      const y = CHART_HEIGHT - ((level - 1) / 4) * (CHART_HEIGHT - 12) - 6;
      return { x: i * stepX, y, day };
    })
    .filter((p): p is { x: number; y: number; day: string } => p !== null);

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {points.length > 1 ? (
          <Polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ) : null}
        {points.map((p) => (
          <Circle key={p.day} cx={p.x} cy={p.y} r={4} fill={p.day === todayStr ? color.primary : color.chartDot} />
        ))}
      </Svg>
      <View style={styles.chartLabelRow}>
        {days.map((day) => (
          <Text key={day} style={styles.chartLabel}>
            {new Date(day).toLocaleDateString(undefined, { weekday: 'narrow' })}
          </Text>
        ))}
      </View>
    </View>
  );
}

function MoodTab() {
  const { hasConsented, giveConsent } = useMoodConsent();
  const { entries, logMoodEntry } = useMoodEntries();
  const [error, setError] = useState<string | null>(null);
  const [justLoggedLevel, setJustLoggedLevel] = useState<number | null>(null);

  async function handleSelect(level: number) {
    setError(null);
    // Handoff: single-tap chip selection logs the entry immediately — no
    // separate energy axis or "Log entry" step. energyLevel mirrors moodLevel
    // since the mockup's data model has no independent energy input.
    const result = await logMoodEntry(level, level);
    if (!result.ok) {
      setError("Couldn't save that entry. Please try again.");
      return;
    }
    setJustLoggedLevel(level);
  }

  if (hasConsented === null) return null;

  if (!hasConsented) {
    return (
      <View style={styles.consentGap}>
        <Text style={styles.consentBody}>
          FocusFlow can save quick mood check-ins so you can look back on patterns later. This is stored privately and only ever tied to your account.
        </Text>
        <Button title="Agree and continue" onPress={giveConsent} />
      </View>
    );
  }

  return (
    <View style={styles.tabGap}>
      <Text style={styles.prompt}>How are you feeling today?</Text>
      <View style={styles.chipRow}>
        {MOOD_LEVELS.map(({ level, label }) => (
          <Pressable
            key={level}
            style={[styles.chip, justLoggedLevel === level && styles.chipSelected]}
            onPress={() => handleSelect(level)}
            accessibilityRole="button"
            accessibilityState={{ selected: justLoggedLevel === level }}
            accessibilityLabel={`Mood: ${label}`}
          >
            <Text style={[styles.chipText, justLoggedLevel === level && styles.chipTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <Card>
        <Text style={styles.cardTitle}>This week</Text>
        <MoodWeekChart entries={entries} />
      </Card>
    </View>
  );
}

function JournalEntryRow({ entry, onRetryMood, onDelete }: { entry: JournalEntry; onRetryMood: (entry: JournalEntry) => void; onDelete: (entry: JournalEntry) => void }) {
  return (
    <Card style={styles.entryCard}>
      <View style={styles.entryBadge}>
        <Icon name="play" size={16} color={color.primary} />
      </View>
      <View style={styles.entryBody}>
        <Text style={styles.entryTitle} numberOfLines={1}>
          {entry.transcript}
        </Text>
        <Text style={styles.entryDate}>{new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
        {entry.mood_summary ? <Text style={styles.entryMood}>Mood: {entry.mood_summary}</Text> : null}
        {entry.feedback ? <Text style={styles.entryFeedback}>{entry.feedback}</Text> : null}
        <View style={styles.entryActions}>
          {!entry.mood_summary ? (
            <Pressable onPress={() => onRetryMood(entry)} accessibilityRole="button" accessibilityLabel="Retry mood analysis">
              <Text style={styles.retryText}>Retry mood analysis</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => onDelete(entry)} accessibilityRole="button" accessibilityLabel="Delete entry">
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function JournalTab() {
  const { hasConsented, giveConsent } = useJournalConsent();
  const { isRecording, isProcessing, startRecording, stopRecording } = useJournalRecorder();
  const { entries, saveEntry, retryMoodAnalysis, deleteEntry } = useJournalEntries();
  const [error, setError] = useState<string | null>(null);

  async function handleToggleRecording() {
    setError(null);
    if (isRecording) {
      const result = await stopRecording();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const saved = await saveEntry(result.result);
      if (!saved.ok) setError("Recorded, but couldn't save the entry. Please try again.");
      return;
    }
    const result = await startRecording();
    if (!result.ok) setError(result.message ?? 'Could not start recording.');
  }

  async function handleRetryMood(entry: JournalEntry) {
    setError(null);
    const result = await retryMoodAnalysis(entry);
    if (!result.ok) setError(result.message ?? "Couldn't analyze that entry.");
  }

  async function handleDelete(entry: JournalEntry) {
    setError(null);
    const result = await deleteEntry(entry.id);
    if (!result.ok) setError("Couldn't delete that entry. Please try again.");
  }

  if (hasConsented === null) return null;

  if (!hasConsented) {
    return (
      <View style={styles.consentGap}>
        <Text style={styles.consentBody}>
          FocusFlow sends your voice recording to OpenAI to transcribe it and read the transcript to suggest a mood summary and short feedback. Recordings are discarded
          immediately after processing — only the text transcript and mood summary are saved to your account.
        </Text>
        <Button title="Agree and continue" onPress={giveConsent} />
      </View>
    );
  }

  return (
    <View style={styles.tabGap}>
      {entries.length === 0 ? <MutedText style={styles.empty}>No journal entries yet.</MutedText> : entries.map((entry) => <JournalEntryRow key={entry.id} entry={entry} onRetryMood={handleRetryMood} onDelete={handleDelete} />)}

      {error ? <ErrorText>{error}</ErrorText> : null}

      <View style={styles.recordArea}>
        <Pressable
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={handleToggleRecording}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <Icon name="mic" size={26} color={color.onPrimary} />
        </Pressable>
        <Text style={styles.recordLabel}>{isProcessing ? 'Processing…' : isRecording ? 'Recording…' : 'Tap to record'}</Text>
      </View>
    </View>
  );
}

// Handoff: Reflect merges the former Mood + Journal tabs behind a segmented
// control — same two features, same consent/recording logic, one screen.
export default function ReflectScreen() {
  const [tab, setTab] = useState<'mood' | 'journal'>('mood');

  return (
    <Screen>
      <ScreenTitle>Reflect</ScreenTitle>
      <SegmentedControl
        options={[
          { value: 'mood', label: 'Mood' },
          { value: 'journal', label: 'Journal' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'mood' ? <MoodTab /> : <JournalTab />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabGap: { gap: spacing.md },
  consentGap: { gap: spacing.md },
  consentBody: { color: color.textSecondary, fontFamily: font.regular, lineHeight: 20 },
  prompt: { fontSize: fontSize.base, fontFamily: font.semibold, color: color.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface },
  chipSelected: { backgroundColor: color.primary, borderColor: color.primary },
  chipText: { fontFamily: font.semibold, color: color.text, fontSize: fontSize.sm },
  chipTextSelected: { color: color.onPrimary },
  cardTitle: { fontSize: fontSize.base, fontFamily: font.semibold, color: color.text },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chartLabel: { fontSize: fontSize.sm, color: color.textMuted, fontFamily: font.regular },
  empty: { textAlign: 'center' },
  entryCard: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  entryBadge: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: color.primaryTint, alignItems: 'center', justifyContent: 'center' },
  entryBody: { flex: 1, gap: 2 },
  entryTitle: { fontFamily: font.semibold, color: color.text, fontSize: fontSize.base },
  entryDate: { color: color.textMuted, fontSize: fontSize.sm, fontFamily: font.regular },
  entryMood: { color: color.success, fontFamily: font.semibold, marginTop: 4 },
  entryFeedback: { color: color.textSecondary, fontStyle: 'italic', fontFamily: font.regular },
  entryActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  retryText: { color: color.textSecondary, textDecorationLine: 'underline', fontFamily: font.regular },
  deleteText: { color: color.destructive, fontFamily: font.regular },
  recordArea: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  recordButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  recordButtonActive: { backgroundColor: color.destructive },
  recordLabel: { color: color.textSecondary, fontFamily: font.regular, fontSize: fontSize.sm },
});
