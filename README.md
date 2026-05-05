# FocusFlow — Progettato per menti ADHD

FocusFlow è un'applicazione mobile innovativa costruita con React Native ed Expo, progettata specificamente per aiutare le persone con ADHD a visualizzare il tempo, gestire le abitudini e monitorare il proprio stato emotivo attraverso un'esperienza ludica e visiva.

## 🚀 Funzionalità Principali

### 1. Timeline Canvas (Skia)
Una visualizzazione del tempo iper-nitida e fluida dove un personaggio pixel-art cammina attraverso la tua giornata.
- **Visualizzazione Spaziale**: Le attività appaiono come blocchi piattaforma.
- **Sincronizzazione Real-Time**: La timeline si muove con te, aiutandoti a combattere la "cecità temporale".

### 2. Widget Android "Now & Next"
Rimani focalizzato senza nemmeno aprire l'app.
- **Pinning Automatico**: Aggiungi il widget alla tua Home con un tocco dalle impostazioni.
- **WorkManager**: Aggiornamenti intelligenti in background.

### 3. Diario Vocale AI
Esprimi i tuoi pensieri e lascia che l'AI faccia il resto.
- **Whisper Integration**: Trascrizione vocale precisa.
- **Analisi Mood (GPT-4o)**: Estrae automaticamente il tuo stato d'animo e ti fornisce feedback motivazionali.

### 4. Tracking Abitudini & Mood
- Sistema di streak per mantenere la costanza.
- Monitoraggio dei livelli di energia e umore.

## 🛠 Tech Stack

- **Framework**: Expo (SDK 55+) con Expo Router
- **Grafica**: @shopify/react-native-skia
- **Animazioni**: React Native Reanimated 4
- **Backend**: Supabase (Auth, DB, Edge Functions)
- **Monetizzazione**: RevenueCat (In-App Purchases)
- **Notifiche**: Expo Notifications + Android Native Modules

## 🏁 Setup per Sviluppatori

1. **Installa le dipendenze**:
   ```bash
   npm install
   ```

2. **Variabili d'ambiente**:
   Crea un file `.env` con le seguenti chiavi:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   EXPO_PUBLIC_OPENAI_API_KEY=...
   EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=...
   EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=...
   ```

3. **Database**:
   Esegui lo script `supabase_schema.sql` nel SQL Editor di Supabase.

4. **Avvio**:
   ```bash
   npx expo start
   ```

## 📄 Licenza
Proprietà esclusiva di Azachris. Tutti i diritti riservati.
