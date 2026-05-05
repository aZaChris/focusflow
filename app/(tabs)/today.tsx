import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, ActivityIndicator } from 'react-native';
import TimelineCanvas from '../../components/timeline/TimelineCanvas';
import VoiceRecorder from '../../components/journal/VoiceRecorder';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { syncWidget } from '../../lib/widgetSync';

/**
 * TodayScreen: La schermata principale dell'applicazione FocusFlow.
 * Visualizza la Timeline interattiva e gestisce la registrazione del diario vocale.
 */
export default function TodayScreen() {
  const { theme } = useTheme();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);

  // Ricarica i dati ogni volta che la Tab viene visualizzata (Focus)
  useFocusEffect(
    useCallback(() => {
      fetchTodayData();
    }, [])
  );

  /**
   * Recupera le abitudini e le attività pianificate per oggi da Supabase.
   */
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
      
      setHabits(data || []);
      
      // Sincronizza il widget nativo Android per riflettere le attività correnti
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

  /**
   * Gestisce il risultato della trascrizione vocale e lo salva su Supabase.
   */
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
            ai_summary: moodData?.summary || "Diario aggiornato"
          }
        ]);

      if (error) throw error;
    } catch (error: any) {
      console.error("Errore salvataggio diario:", error.message);
    }
  };

  if (loading && habits.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: 40 }} />
      
      {/* Componente Skia per la Timeline interattiva */}
      <TimelineCanvas habits={habits} />
      
      {/* Sezione Diario Vocale */}
      <Card style={styles.journalSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>
          Diario di Oggi
        </Text>
        
        {/* Componente per la registrazione audio e trascrizione AI */}
        <VoiceRecorder onTranscriptFound={handleTranscript} />

        {transcript !== null && (
          <View style={styles.transcriptBox}>
            <Text style={[styles.boxLabel, { color: theme.colors.textMuted }]}>
              Trascrizione (Editabile):
            </Text>
            
            <TextInput
              style={[
                styles.editableInput, 
                { color: theme.colors.text, backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }
              ]}
              multiline
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Cosa hai in mente?"
              placeholderTextColor={theme.colors.textMuted}
            />
            
            <Button 
              title="Aggiorna Diario" 
              onPress={() => handleTranscript(transcript, aiSummary)}
              style={styles.saveBtn}
            />

            {aiSummary && (
              <View style={[styles.aiPill, { backgroundColor: theme.colors.primaryDim }]}>
                <Text style={[styles.aiPillText, { color: theme.colors.primary }]}>
                  ✨ Feedback AI: {aiSummary.summary}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalSection: {
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  transcriptBox: {
    marginTop: 20,
  },
  boxLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  editableInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveBtn: {
    marginTop: 15,
  },
  aiPill: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
  },
  aiPillText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  }
});
