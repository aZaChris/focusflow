import { useState } from 'react';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';
import { supabase } from '@/lib/supabase/client';
import { logEvent } from '@/lib/logging/logger';
import { isWithinRecordingCap, MAX_RECORDING_SECONDS } from '@/features/journal/validation/schema';

const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/journal-process`;

export interface JournalProcessResult {
  transcript: string;
  moodSummary: string | null;
  feedback: string | null;
}

export type RecorderResult = { ok: true; result: JournalProcessResult } | { ok: false; message: string };

// research.md §2: the local recording file is deleted immediately after this
// call resolves, success or failure — audio never persists beyond this window.
async function processAndDiscard(uri: string): Promise<RecorderResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const form = new FormData();
    // React Native's fetch/FormData accepts this { uri, name, type } shape for
    // file uploads (not a standard web Blob).
    form.append('audio', { uri, name: 'entry.m4a', type: 'audio/m4a' } as unknown as Blob);

    const res = await fetch(FUNCTIONS_URL, {
      method: 'POST',
      headers: {
        apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: form,
    });

    if (res.status === 422) {
      logEvent('journal_record', 'failure', { detail: 'transcription_failed' });
      return { ok: false, message: "Couldn't understand that recording. Please try again." };
    }
    if (!res.ok) {
      logEvent('journal_record', 'failure', { detail: `status_${res.status}` });
      return { ok: false, message: "Couldn't process that recording. Please try again." };
    }

    const body = await res.json();
    logEvent('journal_record', 'success');
    return { ok: true, result: body };
  } catch (error) {
    logEvent('journal_record', 'failure', { detail: (error as Error).message });
    return { ok: false, message: 'Network error — please check your connection and try again.' };
  } finally {
    new File(uri).delete();
  }
}

export function useJournalRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function startRecording(): Promise<{ ok: boolean; message?: string }> {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      return { ok: false, message: 'Microphone permission is required to record.' };
    }
    await setAudioModeAsync({ allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
    return { ok: true };
  }

  async function stopRecording(): Promise<RecorderResult> {
    await recorder.stop();
    setIsRecording(false);

    const uri = recorder.uri;
    const durationSeconds = recorder.currentTime;
    if (!uri) {
      return { ok: false, message: "Couldn't save that recording. Please try again." };
    }
    if (!isWithinRecordingCap(durationSeconds)) {
      new File(uri).delete();
      return { ok: false, message: `Recordings are limited to ${MAX_RECORDING_SECONDS / 60} minutes.` };
    }

    setIsProcessing(true);
    try {
      return await processAndDiscard(uri);
    } finally {
      setIsProcessing(false);
    }
  }

  return { isRecording, isProcessing, startRecording, stopRecording };
}
