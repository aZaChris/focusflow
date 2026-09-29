import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMoodConsent } from '@/features/mood/hooks/useMoodConsent';
import { useMoodEntries } from '@/features/mood/hooks/useMoodEntries';
import { moodEntrySchema } from '@/features/mood/validation/schema';
import { useJournalConsent } from '@/features/journal/hooks/useJournalConsent';
import { useJournalRecorder } from '@/features/journal/hooks/useJournalRecorder';
import { useJournalEntries, type JournalEntry } from '@/features/journal/hooks/useJournalEntries';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/tokens';

// handoff §5: a single "how are you feeling" chip row (Low..Great). The real
// data model tracks mood and energy as separate 1-5 axes (schema.ts) — kept
// both, styled as two labeled chip rows instead of collapsing to one axis.
const LEVEL_LABELS = ['Low', 'Mellow', 'Balanced', 'Good', 'Great'];

function MoodTab() {
  const { theme } = useTheme();
  const { hasConsented, giveConsent } = useMoodConsent();
  const { entries, logMoodEntry } = useMoodEntries();
  const [moodLevel, setMoodLevel] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);

  async function handleLog() {
    setError(null);
    setSavedJustNow(false);
    const parsed = moodEntrySchema.safeParse({ moodLevel, energyLevel });
    if (!parsed.success) {
      setError('Pick a mood and energy level first.');
      return;
    }
    const result = await logMoodEntry(parsed.data.moodLevel, parsed.data.energyLevel);
    if (!result.ok) {
      setError("Couldn't save that entry. Please try again.");
      return;
    }
    setMoodLevel(null);
    setEnergyLevel(null);
    setSavedJustNow(true);
  }

  const s = makeStyles(theme);
  if (hasConsented === null) return null;

  if (!hasConsented) {
    return (
      <View style={s.consentBox}>
        <Text style={s.consentBody}>
          Foxus can save quick mood and energy check-ins so you can look back on patterns later. This is stored
          privately and only ever tied to your account.
        </Text>
        <Pressable style={s.button} onPress={giveConsent} accessibilityRole="button" accessibilityLabel="Agree and continue">
          <Text style={s.buttonText}>Agree and continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <Text style={s.prompt}>How are you feeling today?</Text>

      <Text style={s.chipGroupLabel}>Mood</Text>
      <View style={s.chipRow}>
        {LEVEL_LABELS.map((label, i) => {
          const level = i + 1;
          const selected = moodLevel === level;
          return (
            <Pressable
              key={`mood-${level}`}
              style={[s.chip, selected && s.chipSelected]}
              onPress={() => setMoodLevel(level)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Mood ${label}`}
            >
              <Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.chipGroupLabel}>Energy</Text>
      <View style={s.chipRow}>
        {LEVEL_LABELS.map((label, i) => {
          const level = i + 1;
          const selected = energyLevel === level;
          return (
            <Pressable
              key={`energy-${level}`}
              style={[s.chip, selected && s.chipSelected]}
              onPress={() => setEnergyLevel(level)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Energy ${label}`}
            >
              <Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      {savedJustNow ? <Text style={s.saved} accessibilityLiveRegion="polite">Saved.</Text> : null}

      <Pressable style={s.button} onPress={handleLog} accessibilityRole="button" accessibilityLabel="Log this entry">
        <Text style={s.buttonText}>Log entry</Text>
      </Pressable>

      <View style={s.card}>
        <Text style={s.cardTitle}>This week</Text>
        {entries.length === 0 ? (
          <Text style={s.empty}>No mood entries yet.</Text>
        ) : (
          <View style={s.weekRow}>
            {entries.slice(0, 7).reverse().map((e) => (
              <View key={e.id} style={s.weekBarTrack}>
                <View style={[s.weekBarFill, { height: `${e.mood_level * 18}%` }]} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function EntryCard({ entry, onRetryMood, onDelete, s }: {
  entry: JournalEntry;
  onRetryMood: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  s: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={s.entryCard}>
      <View style={s.entryHeaderRow}>
        <View style={s.playBadge}>
          <Text style={s.playBadgeIcon}>▶</Text>
        </View>
        <Text style={s.transcript} numberOfLines={2}>{entry.transcript}</Text>
      </View>
      {entry.mood_summary ? (
        <>
          <Text style={s.mood}>Mood: {entry.mood_summary}</Text>
          {entry.feedback ? <Text style={s.feedback}>{entry.feedback}</Text> : null}
        </>
      ) : (
        <Pressable style={s.textButton} onPress={() => onRetryMood(entry)} accessibilityRole="button" accessibilityLabel="Retry mood analysis">
          <Text style={s.retryText}>Retry mood analysis</Text>
        </Pressable>
      )}
      <Pressable style={s.textButton} onPress={() => onDelete(entry)} accessibilityRole="button" accessibilityLabel="Delete entry">
        <Text style={s.deleteText}>Delete</Text>
      </Pressable>
    </View>
  );
}

function JournalTab() {
  const { theme } = useTheme();
  const { hasConsented, giveConsent } = useJournalConsent();
  const { isRecording, isProcessing, startRecording, stopRecording } = useJournalRecorder();
  const { entries, saveEntry, retryMoodAnalysis, deleteEntry } = useJournalEntries();
  const [error, setError] = useState<string | null>(null);
  const s = makeStyles(theme);

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
      <View style={s.consentBox}>
        <Text style={s.consentBody}>
          Foxus sends your voice recording to OpenAI to transcribe it and read the transcript to suggest a mood
          summary and short feedback. Recordings are discarded immediately after processing — only the text
          transcript and mood summary are saved to your account.
        </Text>
        <Pressable style={s.button} onPress={giveConsent} accessibilityRole="button" accessibilityLabel="Agree and continue">
          <Text style={s.buttonText}>Agree and continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EntryCard entry={item} onRetryMood={handleRetryMood} onDelete={handleDelete} s={s} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.cardGap }} />}
        ListEmptyComponent={<Text style={s.empty}>No journal entries yet.</Text>}
        contentContainerStyle={{ gap: spacing.cardGap }}
      />
      {error ? <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text> : null}
      <Pressable
        style={[s.recordButton, isRecording && s.recordButtonActive]}
        onPress={handleToggleRecording}
        disabled={isProcessing}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <Text style={s.recordButtonIcon}>{isRecording ? '■' : '●'}</Text>
      </Pressable>
      <Text style={s.recordLabel}>{isProcessing ? 'Processing…' : isRecording ? 'Recording…' : 'Tap to record'}</Text>
    </View>
  );
}

export default function ReflectScreen() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'mood' | 'journal'>('mood');
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <Text style={s.title}>Reflect</Text>
      <View style={s.segmentedControl}>
        <Pressable style={[s.segment, tab === 'mood' && s.segmentActive]} onPress={() => setTab('mood')}>
          <Text style={[s.segmentText, tab === 'mood' && s.segmentTextActive]}>Mood</Text>
        </Pressable>
        <Pressable style={[s.segment, tab === 'journal' && s.segmentActive]} onPress={() => setTab('journal')}>
          <Text style={[s.segmentText, tab === 'journal' && s.segmentTextActive]}>Journal</Text>
        </Pressable>
      </View>
      {tab === 'mood' ? <MoodTab /> : <JournalTab />}
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: spacing.screenX, backgroundColor: theme.background, gap: 16 },
    title: { fontSize: 22, fontWeight: '800', color: theme.textPrimary },
    segmentedControl: { flexDirection: 'row', backgroundColor: theme.surfaceAlt, borderRadius: 10, padding: 3 },
    segment: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    segmentActive: { backgroundColor: theme.surface },
    segmentText: { color: theme.textSecondary, fontWeight: '600' },
    segmentTextActive: { color: theme.textPrimary },
    section: { flex: 1, gap: 12 },
    prompt: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
    chipGroupLabel: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    chipSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    chipText: { color: theme.textPrimary, fontWeight: '600', fontSize: 13 },
    chipTextSelected: { color: theme.surface },
    button: { backgroundColor: theme.primary, borderRadius: radii.input, padding: 14, alignItems: 'center' },
    buttonText: { color: theme.surface, fontWeight: '700' },
    error: { color: theme.error },
    saved: { color: theme.primary },
    empty: { color: theme.textMuted },
    consentBox: { flex: 1, justifyContent: 'center', gap: 12 },
    consentBody: { color: theme.textSecondary, lineHeight: 20 },
    card: { backgroundColor: theme.surface, borderRadius: radii.card, borderWidth: 1, borderColor: theme.border, padding: 18, gap: 10 },
    cardTitle: { fontWeight: '700', color: theme.textPrimary },
    weekRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 80 },
    weekBarTrack: { flex: 1, height: 80, backgroundColor: theme.surfaceAlt, borderRadius: 4, justifyContent: 'flex-end' },
    weekBarFill: { backgroundColor: theme.primary, borderRadius: 4, minHeight: 4 },
    entryCard: { backgroundColor: theme.surface, borderRadius: radii.card, borderWidth: 1, borderColor: theme.border, padding: 14, gap: 6 },
    entryHeaderRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    playBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.primaryTint, alignItems: 'center', justifyContent: 'center' },
    playBadgeIcon: { color: theme.primary },
    transcript: { color: theme.textPrimary, flex: 1 },
    mood: { color: theme.primary, fontWeight: '600' },
    feedback: { color: theme.textSecondary, fontStyle: 'italic' },
    textButton: { minHeight: 32, justifyContent: 'center' },
    retryText: { color: theme.textSecondary, textDecorationLine: 'underline' },
    deleteText: { color: theme.error },
    recordButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.primary,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordButtonActive: { backgroundColor: theme.error },
    recordButtonIcon: { color: theme.surface, fontSize: 22 },
    recordLabel: { textAlign: 'center', color: theme.textSecondary, fontSize: 13 },
  });
}
