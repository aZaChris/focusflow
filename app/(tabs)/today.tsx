import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import TimelineCanvas from '../../components/timeline/TimelineCanvas';
import VoiceRecorder from '../../components/journal/VoiceRecorder';
import MoodPicker from '../../components/mood/MoodPicker';
import { colors, typography } from '../../constants/theme';

/**
 * TodayScreen: La schermata principale dell'applicazione.
 * Offre una panoramica interattiva della giornata (Timeline), 
 * un diario vocale basato su AI e un selettore del mood.
 */
function TodayScreen() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);

  /**
   * Gestisce il risultato della registrazione vocale.
   * @param text La trascrizione testuale del parlato.
   * @param moodData Dati opzionali estratti dall'AI sull'umore.
   */
  const handleTranscript = (text: string, moodData: any) => {
    setTranscript(text);
    setAiSummary(moodData);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Spacer superiore per il safe area / notch */}
      <View style={styles.headerSpacer} />

      {/* 1. SEZIONE TIMELINE (Superiore)
          Visualizza graficamente gli impegni e gli eventi su un canvas custom. */}
      <TimelineCanvas />
      
      {/* 2. SEZIONE DIARIO (Centrale)
          Contiene lo strumento di registrazione e i risultati della trascrizione AI. */}
      <View style={styles.journalSection}>
        <Text style={styles.sectionTitle}>Diario di Oggi</Text>
        
        {/* Componente per la registrazione audio con Whisper AI */}
        <VoiceRecorder onTranscriptFound={handleTranscript} />

        {/* Visualizzazione della trascrizione se presente */}
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

      {/* 3. SEZIONE MOOD CHECK (Inferiore)
          Permette all'utente di selezionare rapidamente il proprio stato d'animo. */}
      <View style={styles.moodSection}>
        <Text style={styles.sectionTitle}>Come ti senti?</Text>
        <MoodPicker />
      </View>

      {/* Padding finale per evitare che il contenuto finisca sotto le tab */}
      <View style={{ height: 60 }} />
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
    borderRadius: 16,
    marginTop: -20, // Sovrapposizione estetica sulla timeline
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
    backgroundColor: 'rgba(94, 211, 243, 0.1)', // Sfumatura azzurra basata sul tema
    padding: 10,
    borderRadius: 8,
  },
  aiPillText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  }
});
