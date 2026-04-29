import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, Alert, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import TimelineCanvas from '../../components/timeline/TimelineCanvas';
import VoiceRecorder from '../../components/journal/VoiceRecorder';
import MoodPicker from '../../components/mood/MoodPicker';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';

import { syncWidget } from '../../lib/widgetSync';

/**
 * TodayScreen: La schermata principale dell'applicazione.
 */
export default function TodayScreen() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);

  // Ricarica i dati ogni volta che la Tab viene visualizzata
  useFocusEffect(
    useCallback(() => {
      fetchTodayData();
    }, [])
  );

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      console.log("Dati ricevuti da Supabase (Today):", data);
      setHabits(data || []);
      
      // Sincronizziamo il widget nativo in modo asincrono rispetto al render
      if (data) {
        setTimeout(() => {
          syncWidget(data);
        }, 0);
      }
    } catch (error) {
      console.error("Errore recupero dati timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscript = async (text: string, moodData: any) => {
    setTranscript(text);
    setAiSummary(moodData);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('journal_entries')
        .insert([
          {
            user_id: user.id,
            transcript: text,
            ai_summary: moodData.summary
          }
        ]);

      if (error) throw error;
      console.log("Diario salvato su Supabase");
    } catch (error: any) {
      console.error("Errore salvataggio diario:", error.message);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ height: 40 }} />
      <TimelineCanvas habits={habits} />
      
      <View style={[styles.journalSection, { marginTop: 40 }]}>
        <Text style={styles.sectionTitle}>Diario di Oggi</Text>
        <VoiceRecorder onTranscriptFound={handleTranscript} />

        {transcript !== null && (
          <View style={styles.transcriptBox}>
            <Text style={styles.boxLabel}>Trascrizione (Editabile):</Text>
            <TextInput
              style={styles.editableInput}
              multiline
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Cosa hai in mente?"
              placeholderTextColor={colors.muted}
            />
            
            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={() => handleTranscript(transcript, aiSummary)}
            >
              <Text style={styles.saveBtnText}>Aggiorna Diario</Text>
            </TouchableOpacity>

            {aiSummary && (
              <View style={styles.aiPill}>
                <Text style={styles.aiPillText}>✨ Feedback AI: {aiSummary.summary}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerSpacer: {
    height: 60,
  },
  journalSection: {
    padding: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 24,
    marginTop: -20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  moodSection: {
    padding: 24,
  },
  transcriptBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.surface2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  editableInput: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
    textAlignVertical: 'top',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  saveBtnText: {
    color: colors.bg,
    fontWeight: 'bold',
    fontSize: 14,
  },
  aiPill: {
    marginTop: 10,
    backgroundColor: 'rgba(200, 240, 74, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  aiPillText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  }
});
