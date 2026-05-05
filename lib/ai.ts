import { supabase } from './supabase';

/**
 * AI Service: Gestisce le chiamate a Whisper (Trascrizione) e Claude/GPT (Analisi).
 * Nota: In produzione, queste chiamate dovrebbero passare attraverso Supabase Edge Functions
 * per proteggere le chiavi API.
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

/**
 * Trascrive un file audio utilizzando l'API Whisper di OpenAI.
 */
export const transcribeAudio = async (uri: string): Promise<string> => {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API Key mancante. Utilizzo mock per la trascrizione.");
    return "Esempio di trascrizione: Oggi è stata una giornata produttiva, ho completato il modulo nativo.";
  }

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'audio/m4a',
    name: 'audio.m4a',
  } as any);
  formData.append('model', 'whisper-1');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    return data.text || "Trascrizione fallita.";
  } catch (error) {
    console.error("Errore Whisper:", error);
    throw error;
  }
};

/**
 * Analizza il testo per estrarre il mood e una sintesi utilizzando GPT-4o.
 */
export const analyzeMood = async (text: string): Promise<{ summary: string; mood: string }> => {
  if (!OPENAI_API_KEY) {
    return { 
      summary: "Sintesi generica: L'utente sembra focalizzato ma stanco.", 
      mood: "neutral" 
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Sei un assistente per utenti ADHD. Analizza il diario dell'utente, estrai il mood dominante e scrivi una brevissima sintesi motivazionale (max 15 parole) in italiano."
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    // Nota: Dovresti istruire il modello a restituire JSON valido
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error("Errore GPT Analysis:", error);
    return { summary: "Errore nell'analisi AI.", mood: "unknown" };
  }
};
