import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, typography } from '../../constants/theme';

const MOODS = [
  { label: 'Pessimo', emoji: '😢', score: 1 },
  { label: 'Giù', emoji: '🫤', score: 2 },
  { label: 'Neutro', emoji: '😐', score: 3 },
  { label: 'Bene', emoji: '🙂', score: 4 },
  { label: 'Ottimo', emoji: '🤩', score: 5 },
];

const ENERGIES = [
  { label: 'Esausto', emoji: '🔋', score: 1 },
  { label: 'Stanco', emoji: '🪫', score: 2 },
  { label: 'Normale', emoji: '🔌', score: 3 },
  { label: 'Attivo', emoji: '⚡', score: 4 },
  { label: 'Carico', emoji: '🚀', score: 5 },
];

export default function MoodPicker() {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);

  const handleSave = () => {
    if (mood && energy) {
      // MOCK: Qui andrebbe supabase.from('mood_logs').insert(...)
      Alert.alert('Salvato!', 'Log di umore ed energia salvato con successo su Supabase.');
      setMood(null);
      setEnergy(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Umore</Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <TouchableOpacity 
            key={m.score} 
            style={[styles.emojiBtn, mood === m.score && styles.activeEmoji]}
            onPress={() => setMood(m.score)}
          >
            <Text style={styles.emojiText}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.title}>Energia</Text>
      <View style={styles.row}>
        {ENERGIES.map((e) => (
          <TouchableOpacity 
            key={e.score} 
            style={[styles.emojiBtn, energy === e.score && styles.activeEmoji]}
            onPress={() => setEnergy(e.score)}
          >
            <Text style={styles.emojiText}>{e.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mood && energy && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Salva Check-in</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  emojiBtn: { padding: 10, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  activeEmoji: { borderColor: colors.accent, backgroundColor: colors.accentDim, transform: [{ scale: 1.1 }] },
  emojiText: { fontSize: 24 },
  saveBtn: { backgroundColor: colors.accent, padding: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: colors.bg, fontWeight: 'bold', fontSize: 16 }
});
