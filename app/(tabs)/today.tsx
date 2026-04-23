import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, Alert } from 'react-native';
import TimelineCanvas from '../../components/timeline/TimelineCanvas';
import VoiceRecorder from '../../components/journal/VoiceRecorder';
import MoodPicker from '../../components/mood/MoodPicker';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

/**
 * TodayScreen: La schermata principale dell'applicazione.
 */
function TodayScreen() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);

  /**
   * Gestisce il risultato della registrazione vocale e lo salva su Supabase.
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
            ai_summary: moodData.summary
          }
        ]);

      if (error) throw error;
      
      // Feedback silenzioso o log per confermare il salvataggio cloud
      console.log("Diario salvato su Supabase");
    } catch (error: any) {
      console.error("Errore salvataggio diario:", error.message);
      Alert.alert("Errore", "Il pensiero è stato visualizzato ma non è stato possibile salvarlo nel cloud.");
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSpacer} />

      <TimelineCanvas />
      
      <View style={styles.journalSection}>
        <Text style={styles.sectionTitle}>Diario di Oggi</Text>
        <VoiceRecorder onTranscriptFound={handleTranscript} />

        {transcript && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
            {aiSummary && (
              <View style={styles.aiPill}>
                <Text style={styles.aiPillText}>✨ Feedback AI: {aiSummary.summary}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.moodSection}>
        <Text style={styles.sectionTitle}>Come ti senti?</Text>
        <MoodPicker />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

export default TodayScreen;

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
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  transcriptText: {
    color: colors.text,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 22,
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
