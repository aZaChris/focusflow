import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { colors, typography } from '../../constants/theme';

interface VoiceRecorderProps {
  onTranscriptFound: (text: string, moodData: any) => void;
}

export default function VoiceRecorder({ onTranscriptFound }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    setIsProcessing(true);
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      const uri = recording.getURI();
      console.log('Audio registrato in:', uri);
      
      // SIMULAZIONE: Chiamata API a Whisper e poi Claude API
      // In un'app reale qui invieremmo il file tramite FormData a Supabase Edge Function o API Route
      setTimeout(() => {
        setIsProcessing(false);
        onTranscriptFound(
          "Oggi mi sento molto meglio, ho finito quasi tutti i compiti del lavoro. Un po' di ansia per domani, ma gestibile.",
          { summary: "Senso di realizzazione unito a lieve ansia anticipatoria.", keywords: ["meglio", "ansia gestibile"] }
        );
      }, 2500);
    }
  }

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.processing}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.processingText}>L'AI sta ascoltando...</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.recordButton, recording && styles.recordingActive]} 
          onPress={recording ? stopRecording : startRecording}
        >
          <Text style={[styles.buttonText, recording && styles.recordingText]}>
            {recording ? "⏹ Termina e Analizza" : "🎤 Registra Pensiero"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  recordingActive: {
    borderColor: colors.activities.red,
    backgroundColor: '#ff6b6b22',
  },
  buttonText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
    fontWeight: 'bold',
  },
  recordingText: {
    color: colors.activities.red,
  },
  processing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingText: {
    color: colors.muted,
    fontFamily: typography.sans,
    fontStyle: 'italic',
  }
});
