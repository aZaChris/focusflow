import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, typography } from '../../constants/theme';

/**
 * Costanti per le opzioni dell'umore.
 */
const MOODS = [
  { label: 'Pessimo', emoji: '😢', score: 1 },
  { label: 'Giù', emoji: '🫤', score: 2 },
  { label: 'Neutro', emoji: '😐', score: 3 },
  { label: 'Bene', emoji: '🙂', score: 4 },
  { label: 'Ottimo', emoji: '🤩', score: 5 },
];

/**
 * Costanti per le opzioni dell'energia.
 */
const ENERGIES = [
  { label: 'Esausto', emoji: '🔋', score: 1 },
  { label: 'Stanco', emoji: '🪫', score: 2 },
  { label: 'Normale', emoji: '🔌', score: 3 },
  { label: 'Attivo', emoji: '⚡', score: 4 },
  { label: 'Carico', emoji: '🚀', score: 5 },
];

/**
 * MoodPicker: Componente per il check-in rapido dello stato emotivo e dei livelli di energia.
 * Permette all'utente di registrare come si sente in pochi tap.
 */
export default function MoodPicker() {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);

  /**
   * Salva i dati del check-in.
   * In produzione, questi dati vengono inviati al database Supabase.
   */
  const handleSave = () => {
    if (mood && energy) {
      // 🛠 MOCK: Qui andrebbe supabase.from('mood_logs').insert(...)
      // Utilizziamo un Alert per confermare l'azione all'utente.
      Alert.alert(
        'Check-in Completato', 
        'Il tuo log di umore ed energia è stato salvato con successo!'
      );
      
      // Reset dei selettori dopo il salvataggio
      setMood(null);
      setEnergy(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sezione Umore */}
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

      {/* Sezione Energia */}
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

      {/* Pulsante di Salvataggio: Appare solo quando entrambi i valori sono selezionati */}
      {mood && energy && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Salva Check-in</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginTop: 5 
  },
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
    backgroundColor: 'rgba(94, 211, 243, 0.15)', // Sfumatura azzurra del tema
    transform: [{ scale: 1.15 }] 
  },
  emojiText: { 
    fontSize: 24 
  },
  saveBtn: { 
    backgroundColor: colors.accent, 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { 
    color: colors.bg, 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});
