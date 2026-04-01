import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography } from '../../constants/theme';
import TimelineCanvas from '../../components/timeline/TimelineCanvas';
import VoiceRecorder from '../../components/journal/VoiceRecorder';
import MoodPicker from '../../components/mood/MoodPicker';

export default function TodayScreen() {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);

  const handleTranscript = (text: string, moodData: any) => {
    setTranscript(text);
    setAiSummary(moodData);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Spacer */}
      <View style={styles.headerSpacer} />

      {/* 1. Timeline Section (Top) */}
      <TimelineCanvas />
      
      {/* 2. Journal Section (Middle) */}
      <View style={styles.journalSection}>
        <Text style={styles.sectionTitle}>Diario</Text>
        
        <VoiceRecorder onTranscriptFound={handleTranscript} />

        {transcript && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
            {aiSummary && (
              <View style={styles.aiPill}>
                <Text style={styles.aiPillText}>✨ {aiSummary.summary}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 3. Mood Check Section (Bottom) */}
      <View style={styles.moodSection}>
        <MoodPicker />
      </View>

      <View style={{ height: 40 }} />
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
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    marginVertical: 20,
    marginHorizontal: 15,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  moodSection: {
    padding: 20,
    marginHorizontal: 15,
    backgroundColor: colors.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  placeholder: {
    color: colors.muted,
    fontFamily: typography.sans,
    fontSize: 14,
    fontStyle: 'italic',
  },
  transcriptBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: colors.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transcriptText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  aiPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#c8f04a11',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  aiPillText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  }
});
