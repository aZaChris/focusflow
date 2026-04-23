import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

/**
 * MoodPicker: Componente per il check-in rapido dello stato emotivo e dei livelli di energia.
 */
export default function MoodPicker() {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (!mood || !energy) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Devi essere loggato per salvare il mood');

      const { error } = await supabase
        .from('mood_logs')
        .insert([
          { 
            user_id: user.id, 
            mood_score: mood, 
            energy_score: energy 
          }
        ]);

      if (error) throw error;

      Alert.alert('Check-in Completato', 'Il tuo stato d\'animo è stato registrato!');
      setMood(null);
      setEnergy(null);
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stato d'Animo</Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <TouchableOpacity 
            key={m.score} 
            style={[styles.emojiBtn, mood === m.score && styles.activeEmoji]}
            onPress={() => setMood(m.score)}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.title}>Livello di Energia</Text>
      <View style={styles.row}>
        {ENERGIES.map((e) => (
          <TouchableOpacity 
            key={e.score} 
            style={[styles.emojiBtn, energy === e.score && styles.activeEmoji]}
            onPress={() => setEnergy(e.score)}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{e.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mood && energy && (
        <TouchableOpacity 
          style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.saveText}>Salva Check-in</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 5 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  title: { 
    color: colors.text, 
    fontFamily: typography.sans, 
    fontSize: 16, 
    marginBottom: 10, 
    fontWeight: 'bold' 
  },
  emojiBtn: { 
    padding: 10, 
    borderRadius: 20, 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border,
  },
  activeEmoji: { 
    borderColor: colors.accent, 
    backgroundColor: 'rgba(200, 240, 74, 0.15)',
    transform: [{ scale: 1.1 }] 
  },
  emojiText: { fontSize: 24 },
  saveBtn: { 
    backgroundColor: colors.accent, 
    padding: 15, 
    borderRadius: 15, 
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  saveText: { 
    color: colors.bg, 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});
