# FocusFlow 🧠

FocusFlow è un'applicazione per la gestione quotidiana e il benessere mentale, progettata specificamente per supportare le persone con ADHD (o chiunque desideri una maggiore chiarezza mentale). Combina un diario vocale basato su AI, un sistema di tracciamento del mood e una timeline interattiva per visualizzare la propria giornata.

## ✨ Caratteristiche Principali

- **Diario Vocale AI**: Registra i tuoi pensieri e lascia che l'AI generi riassunti automatici.
- **Mood Tracking**: Traccia il tuo stato emotivo durante il giorno con un'interfaccia intuitiva.
- **Timeline Canvas**: Una visualizzazione grafica degli eventi e dei compiti della giornata.
- **Supporto Freemium/Pro**: Integrazione con RevenueCat per la gestione degli abbonamenti.
- **Autenticazione Sicura**: Gestita tramite Supabase.

## 🛠 Tech Stack

- **Frontend**: React Native, Expo (SDK 51+), Expo Router.
- **Backend**: Supabase (Database & Auth).
- **AI**: OpenAI (Whisper per trascrizione, GPT per riassunti).
- **Pagamenti**: RevenueCat.
- **Grafica**: React Native Skia, Reanimated.

## 🚀 Guida all'Avvio

### 1. Prerequisiti
- Node.js installato.
- Expo CLI (`npm install -g expo-cli`).
- Account Supabase, OpenAI e RevenueCat.

### 2. Installazione
Clona il repository e installa le dipendenze:
```bash
npm install
```

### 3. Configurazione
Crea un file `.env` nella root del progetto partendo da `.env.example`:
```bash
cp .env.example .env
```
Inserisci le tue chiavi API nel file `.env`.

### 4. Avvio in Sviluppo
Per testare con le funzionalità native (come RevenueCat o Skia), si consiglia l'uso di **Development Builds**:
```bash
# Per Android
npx expo run:android

# Per iOS
npx expo run:ios
```
Altrimenti, per lo sviluppo rapido delle UI:
```bash
npm start
```

## 📂 Struttura del Progetto

- `app/`: Contiene le rotte dell'applicazione (Expo Router).
- `components/`: Componenti UI riutilizzabili suddivisi per funzionalità.
- `constants/`: Temi, colori e costanti globali.
- `lib/`: Configurazioni di servizi esterni (Supabase, RevenueCat).
- `assets/`: Immagini, font e icone.

## 🤝 Contribuire
Il progetto è in fase di sviluppo attivo. Sentiti libero di aprire issue o pull request per suggerimenti e miglioramenti.

---
Creato con ❤️ per aiutare a focalizzarsi su ciò che conta davvero.
