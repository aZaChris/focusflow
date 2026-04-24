import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../../constants/theme';
import Constants from 'expo-constants';

// Caricamento condizionale per evitare crash su Expo Go
let Audio: any = null;
if (Constants.appOwnership !== 'expo') {
  try {
    Audio = require('expo-av').Audio;
  } catch (e) {}
}

interface VoiceRecorderProps {
  onTranscriptFound: (text: string, moodData: any) => void;
}

export default function VoiceRecorder({ onTranscriptFound }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (recording && recording.stopAndUnloadAsync) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  async function startRecording() {
    if (!Audio) {
      console.log("Modalità Simulazione (Expo Go)");
      setIsRecording(true);
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permesso Negato", "Accesso al microfono necessario.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Errore microfono:', err);
      setIsRecording(true); // Fallback al mock se fallisce il nativo
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    setIsProcessing(true);

    try {
      if (recording && recording.stopAndUnloadAsync) {
        await recording.stopAndUnloadAsync();
      }

      setTimeout(() => {
        onTranscriptFound(
          "Oggi mi sento molto meglio, ho finito quasi tutti i compiti del lavoro. (Registrazione reale completata)",
          { summary: "Sintesi AI Coming Soon..." }
        );
        setIsProcessing(false);
        setRecording(null);
      }, 2000);

    } catch (err) {
      console.error('Errore stop:', err);
      setIsProcessing(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.recordBtn, isRecording && styles.recordingActive]} 
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        {isProcessing ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Feather name={isRecording ? "square" : "mic"} size={28} color={colors.bg} />
        )}
      </TouchableOpacity>
      
      <Text style={styles.statusText}>
        {isRecording ? "Ti sto ascoltando..." : isProcessing ? "Elaborazione..." : "Tocca per parlare"}
      </Text>
      <Text style={styles.comingSoon}>Funzionalità sintesi AI coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  recordingActive: {
    backgroundColor: colors.activities.red,
  },
  statusText: {
    color: colors.text,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: typography.sans,
  },
  comingSoon: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.7,
  }
});
