import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { transcribeAudio, analyzeMood } from '../../lib/ai';
import Constants from 'expo-constants';

// Caricamento condizionale per evitare crash su Expo Go se le librerie native mancano
let Audio: any = null;
if (Constants.appOwnership !== 'expo') {
  try {
    Audio = require('expo-av').Audio;
  } catch (e) {
    console.warn("expo-av non trovato");
  }
}

interface VoiceRecorderProps {
  onTranscriptFound: (text: string, moodData: any) => void;
}

/**
 * VoiceRecorder: Gestisce la registrazione audio e l'integrazione con le API AI.
 * Utilizza Whisper per la trascrizione e GPT per l'analisi del mood.
 */
export default function VoiceRecorder({ onTranscriptFound }: VoiceRecorderProps) {
  const { theme } = useTheme();
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pulizia della registrazione quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (recording && recording.stopAndUnloadAsync) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  /**
   * Avvia la registrazione audio.
   */
  async function startRecording() {
    if (!Audio) {
      console.log("Modalità Simulazione (Expo Go)");
      setIsRecording(true);
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permesso Negato", "Accesso al microfono necessario per il diario vocale.");
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
      // Fallback per simulazione se il nativo fallisce in dev
      setIsRecording(true);
    }
  }

  /**
   * Ferma la registrazione e avvia il processo di trascrizione/analisi AI.
   */
  async function stopRecording() {
    setIsRecording(false);
    setIsProcessing(true);

    try {
      let audioUri = "";
      
      if (recording && recording.stopAndUnloadAsync) {
        await recording.stopAndUnloadAsync();
        audioUri = recording.getURI();
      }

      // 1. Trascrizione con Whisper
      const transcript = audioUri 
        ? await transcribeAudio(audioUri) 
        : "Oggi mi sento bene e focalizzato sui miei obiettivi.";

      // 2. Analisi Mood con GPT
      const moodData = await analyzeMood(transcript);

      // Invia i dati al componente padre (TodayScreen)
      onTranscriptFound(transcript, moodData);

    } catch (err) {
      console.error('Errore durante l\'elaborazione AI:', err);
      Alert.alert("Errore AI", "Non è stato possibile processare l'audio.");
    } finally {
      setIsProcessing(false);
      setRecording(null);
    }
  }

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface2 }]}>
      <TouchableOpacity 
        style={[
          styles.recordBtn, 
          { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
          isRecording && { backgroundColor: theme.colors.error, shadowColor: theme.colors.error }
        ]} 
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        {isProcessing ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Feather 
            name={isRecording ? "square" : "mic"} 
            size={28} 
            color={theme.colors.background} 
          />
        )}
      </TouchableOpacity>
      
      <Text style={[styles.statusText, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>
        {isRecording ? "Ti sto ascoltando..." : isProcessing ? "L'AI sta analizzando..." : "Tocca per parlare"}
      </Text>
      
      <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>
        L'audio verrà trascritto e analizzato istantaneamente.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    padding: 24,
    borderRadius: 25,
    borderWidth: 1,
  },
  recordBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  statusText: {
    marginTop: 15,
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  }
});
