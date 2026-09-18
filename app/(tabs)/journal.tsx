import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useJournalConsent } from '@/features/journal/hooks/useJournalConsent';
import { useJournalRecorder } from '@/features/journal/hooks/useJournalRecorder';
import { useJournalEntries, type JournalEntry } from '@/features/journal/hooks/useJournalEntries';

function EntryCard({
  entry,
  onRetryMood,
  onDelete,
}: {
  entry: JournalEntry;
  onRetryMood: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
}) {
  return (
    <View style={styles.entryCard}>
      <Text style={styles.transcript}>{entry.transcript}</Text>
      {entry.mood_summary ? (
        <>
          <Text style={styles.mood}>Mood: {entry.mood_summary}</Text>
          {entry.feedback ? <Text style={styles.feedback}>{entry.feedback}</Text> : null}
        </>
      ) : (
        <Pressable
          style={styles.textButton}
          onPress={() => onRetryMood(entry)}
          accessibilityRole="button"
          accessibilityLabel="Retry mood analysis"
        >
          <Text style={styles.retryText}>Retry mood analysis</Text>
        </Pressable>
      )}
      <Pressable
        style={styles.textButton}
        onPress={() => onDelete(entry)}
        accessibilityRole="button"
        accessibilityLabel="Delete entry"
      >
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </View>
  );
}

export default function JournalScreen() {
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
      if (!saved.ok) {
        setError("Recorded, but couldn't save the entry. Please try again.");
      }
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
      <View style={styles.container}>
        <Text style={styles.title}>Voice journal</Text>
        <Text style={styles.consentBody}>
          Foxus sends your voice recording to OpenAI to transcribe it and read the
          transcript to suggest a mood summary and short feedback. Recordings are
          discarded immediately after processing — only the text transcript and mood
          summary are saved to your account.
        </Text>
        <Pressable
          style={styles.button}
          onPress={giveConsent}
          accessibilityRole="button"
          accessibilityLabel="Agree and continue"
        >
          <Text style={styles.buttonText}>Agree and continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice journal</Text>

      <Pressable
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
        onPress={handleToggleRecording}
        disabled={isProcessing}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <Text style={styles.recordButtonText}>
          {isProcessing ? 'Processing…' : isRecording ? 'Stop' : 'Record'}
        </Text>
      </Pressable>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Text style={styles.sectionTitle}>History</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No journal entries yet.</Text>
      ) : (
        entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onRetryMood={handleRetryMood} onDelete={handleDelete} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  consentBody: { color: '#333', lineHeight: 20 },
  button: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  recordButton: {
    backgroundColor: '#111',
    borderRadius: 40,
    height: 80,
    width: 80,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { backgroundColor: '#900' },
  recordButtonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c00' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  empty: { color: '#666' },
  entryCard: { borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 12, gap: 6 },
  transcript: { color: '#111' },
  mood: { color: '#276b3d', fontWeight: '600' },
  feedback: { color: '#333', fontStyle: 'italic' },
  textButton: { minHeight: 44, justifyContent: 'center' },
  retryText: { color: '#333', textDecorationLine: 'underline' },
  deleteText: { color: '#900' },
});
