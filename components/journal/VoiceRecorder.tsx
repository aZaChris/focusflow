import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { colors, typography } from '../../constants/theme';

/**
 * Interfaccia per le proprietà del componente VoiceRecorder.
 */
interface VoiceRecorderProps {
  /** Callback chiamata quando l'AI ha finito di processare la registrazione */
  onTranscriptFound: (text: string, moodData: any) => void;
}

/**
 * VoiceRecorder: Componente per la registrazione dei pensieri quotidiani.
 * Gestisce l'accesso al microfono, la registrazione audio e simula il processamento
 * tramite intelligenza artificiale per generare trascrizioni e riassunti.
 */
export default function VoiceRecorder({ onTranscriptFound }: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Fallback: Se il modulo Audio non è disponibile (es. problemi di build nativa),
   * avvisa l'utente invece di crashare.
   */
  if (!Audio || !Audio.Recording) {
    return (
      <View style={styles.container}>
        <Text style={styles.fallbackText}>Registratore vocale non disponibile.</Text>
      </View>
    );
  }

  /**
   * Avvia una nuova sessione di registrazione audio.
   * Richiede i permessi all'utente se non già concessi.
   */
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
      console.error('Errore durante l\'avvio della registrazione:', err);
    }
  }

  /**
   * Termina la registrazione corrente e simula l'invio al server AI.
   */
  async function stopRecording() {
    setIsProcessing(true);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        
        console.log('Audio salvato localmente:', uri);
        
        /**
         * 🔄 SIMULAZIONE PROCESSO AI:
         * In produzione, qui invieremmo l'audio a un'API Whisper per la trascrizione
         * e poi a un'API GPT per l'analisi del contenuto.
         */
        setTimeout(() => {
          setIsProcessing(false);
          onTranscriptFound(
            "Oggi mi sento molto meglio, ho finito quasi tutti i compiti del lavoro. Un po' di ansia per domani, ma gestibile.",
            { summary: "Senso di realizzazione unito a lieve ansia anticipatoria.", keywords: ["meglio", "ansia gestibile"] }
          );
        }, 2500);
      } catch (error) {
        console.error('Errore durante il salvataggio dell\'audio:', error);
        setIsProcessing(false);
      }
    }
  }

  return (
    <View style={styles.container}>
      {isProcessing ? (
        /* UI durante il processamento ("ascolto") AI */
        <View style={styles.processing}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.processingText}>L'AI sta analizzando i tuoi pensieri...</Text>
        </View>
      ) : (
        /* Pulsante interattivo per registrare */
        <TouchableOpacity 
          style={[styles.recordButton, recording && styles.recordingActive]} 
          onPress={recording ? stopRecording : startRecording}
          activeOpacity={0.8}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  recordingActive: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  buttonText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
    fontWeight: 'bold',
  },
  recordingText: {
    color: '#ff6b6b',
  },
  processing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 20,
  },
  processingText: {
    color: colors.muted,
    fontFamily: typography.sans,
    fontSize: 14,
    fontStyle: 'italic',
  },
  fallbackText: { 
    color: colors.muted, 
    fontStyle: 'italic', 
    fontSize: 13 
  }
});
