import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMoodConsent } from '@/features/mood/hooks/useMoodConsent';
import { useMoodEntries } from '@/features/mood/hooks/useMoodEntries';
import { moodEntrySchema } from '@/features/mood/validation/schema';

const LEVELS = [1, 2, 3, 4, 5];

export default function MoodScreen() {
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

  if (hasConsented === null) return null;

  if (!hasConsented) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mood check-ins</Text>
        <Text style={styles.consentBody}>
          Foxus can save quick mood and energy check-ins so you can look back on
          patterns later. This is stored privately and only ever tied to your account.
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
      <Text style={styles.title}>How are you feeling?</Text>

      <Text style={styles.sectionTitle}>Mood</Text>
      <View style={styles.levelRow}>
        {LEVELS.map((level) => (
          <Pressable
            key={`mood-${level}`}
            style={[styles.levelButton, moodLevel === level && styles.levelButtonSelected]}
            onPress={() => setMoodLevel(level)}
            accessibilityRole="button"
            accessibilityState={{ selected: moodLevel === level }}
            accessibilityLabel={`Mood level ${level}`}
          >
            <Text style={styles.levelText}>{level}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Energy</Text>
      <View style={styles.levelRow}>
        {LEVELS.map((level) => (
          <Pressable
            key={`energy-${level}`}
            style={[styles.levelButton, energyLevel === level && styles.levelButtonSelected]}
            onPress={() => setEnergyLevel(level)}
            accessibilityRole="button"
            accessibilityState={{ selected: energyLevel === level }}
            accessibilityLabel={`Energy level ${level}`}
          >
            <Text style={styles.levelText}>{level}</Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {savedJustNow ? (
        <Text style={styles.saved} accessibilityLiveRegion="polite">
          Saved.
        </Text>
      ) : null}

      <Pressable
        style={styles.button}
        onPress={handleLog}
        accessibilityRole="button"
        accessibilityLabel="Log this entry"
      >
        <Text style={styles.buttonText}>Log entry</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>History</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No mood entries yet.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyRow}>
              <Text style={styles.historyText}>
                Mood {item.mood_level} · Energy {item.energy_level}
              </Text>
              <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleString()}</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  consentBody: { color: '#333', lineHeight: 20 },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelButtonSelected: { backgroundColor: '#111' },
  levelText: { fontWeight: '600' },
  button: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c00' },
  saved: { color: '#276b3d' },
  empty: { color: '#666' },
  historyRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyText: { fontWeight: '600' },
  historyDate: { color: '#666', fontSize: 12, marginTop: 2 },
});
