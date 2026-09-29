# Checklist QA manuale — test su device in sospeso

Riunisce tutta la QA manuale rimasta in sospeso per `004-subscription-monetization`,
`005-ai-voice-journal` e `006-now-next-widget` (tracciata come task `⏸️` nei
rispettivi `tasks.md`). Niente di quanto segue può girare con `npm test` — vedi
il `research.md` §4 di ogni feature per il perché. Spunta le voci man mano che
proceedi; questo file è "usa e getta": una volta tutto verde (o spostato in
nuove task) può essere cancellato.

---

## Parte A — Setup ambiente una tantum (Android Studio)

Da fare una volta sola; sblocca tutte e tre le feature qui sotto.

- [ ] Installa Android Studio, aprilo una volta e lascia che completi da solo
      il download dei componenti SDK al primo avvio (Android SDK Platform,
      Platform-Tools, un'immagine emulatore se vuoi usarne uno).
- [ ] Verifica che `ANDROID_HOME`/`ANDROID_SDK_ROOT` sia impostata e che `adb`
      sia nel tuo `PATH` (Android Studio → SDK Manager mostra il percorso
      dell'SDK; aggiungi `<sdk>/platform-tools` e `<sdk>/emulator` al `PATH`).
- [ ] In alternativa: crea un emulatore (Android Studio → Device Manager →
      Create Device), **oppure** collega un telefono Android reale con il
      debug USB attivo (Impostazioni → Info telefono → tocca 7 volte "Numero
      build", poi Impostazioni → Opzioni sviluppatore → Debug USB).
- [ ] Da `foxus/`, genera il progetto Android nativo:
      ```bash
      npx expo prebuild
      ```
- [ ] Compila e installa una development build:
      ```bash
      npx expo run:android
      ```
      Compila in locale (nessuna coda cloud EAS) e installa su qualsiasi
      device/emulatore risulti connesso da `adb devices`.
- [ ] Verifica che l'app si avvii e che tu possa accedere con un account di
      test (`001-user-auth`).

---

## Parte B — `004-subscription-monetization` (RevenueCat)

### Setup una tantum RevenueCat/store

- [ ] Progetto RevenueCat creato, con l'app Android aggiunta e la sua API key
      copiata.
- [ ] Imposta `EXPO_PUBLIC_REVENUECAT_API_KEY` in `foxus/.env` con
      quella chiave **pubblica** (mai una chiave segreta — Principio VII).
- [ ] Su RevenueCat: un entitlement (deve corrispondere a
      `ENTITLEMENT_ID = 'premium'` in
      `src/features/subscription/hooks/useEntitlement.ts`) e un prodotto,
      esposti tramite un'unica offering segnata come "current".
- [ ] Su Google Play Console: un account di license-testing aggiunto (Setup →
      License testing), e l'app caricata almeno su una track di internal
      testing.
- [ ] Ricompila dopo aver cambiato `.env`/`app.json` (di nuovo
      `npx expo run:android`).

### Scenario 1 — Vedi i piani e abbonati

- [ ] Accedi, apri la schermata abbonamento → piano e prezzo sono mostrati.
- [ ] Acquista il piano con l'account di license-testing → appare la UI
      nativa di acquisto; al successo, la schermata mostra l'entitlement
      attivo automaticamente.
- [ ] Avvia un acquisto e annullalo a metà (o forza la modalità aereo durante
      il flusso) → messaggio chiaro mostrato, nessun crash/blocco.

### Scenario 2 — Ripristina un acquisto precedente

- [ ] Con l'account dello Scenario 1 ancora abbonato, reinstalla l'app (o
      esci/rientra da zero), accedi di nuovo → la schermata abbonamento
      mostra già l'entitlement attivo **senza** bisogno di alcun tocco
      (conferma che l'identità è legata all'account).
- [ ] Con un account nuovo/mai abbonato, tocca "Restore purchases" →
      messaggio chiaro "niente da ripristinare", non un errore.

### Scenario 3 — Vedi e gestisci lo stato dell'abbonamento

- [ ] Con l'account abbonato, apri le impostazioni account → piano, stato
      attivo, rinnovo/scadenza mostrati.
- [ ] Tocca "Manage subscription" → si apre la gestione abbonamenti nativa
      del Play Store.
- [ ] Con un account mai abbonato, apri le impostazioni account → stato
      accurato "nessun abbonamento attivo", non vuoto/rotto.

### Verifica trasversale

- [ ] Con un account mai abbonato, usa habit, mood logging e timeline da
      cima a fondo → tutto pienamente funzionante, niente bloccato o
      degradato.

---

## Parte C — `005-ai-voice-journal` (OpenAI)

### Setup una tantum

- [ ] Imposta il secret della Edge Function (non è un valore `.env`
      dell'app):
      ```bash
      supabase secrets set OPENAI_API_KEY=sk-...
      ```
- [ ] Fai il deploy della funzione:
      ```bash
      supabase functions deploy journal-process --use-api
      ```
- [ ] Aggiungi un breve file audio di test anche per i test automatici
      (pochi secondi di parlato chiaro, es. "Today was a pretty good day, I
      got through my whole to-do list"), salvato come
      `tests/fixtures/journal-test-clip.m4a` (vedi
      `tests/fixtures/README.md`). Fonte più semplice: registralo dal
      telefono e trasferiscilo, oppure esportalo dall'app stessa una volta
      che la registrazione funziona.
- [ ] Lancia la suite automatica una volta fatto quanto sopra:
      ```bash
      npm test
      ```
      Aspettati che `tests/integration/journal/*.test.ts` passi da fallire
      (404 / file mancante) a verde — chiamano davvero l'API OpenAI, quindi
      ogni run ha un piccolo costo reale (research.md §4).

### Scenario 1 — Parla invece di scrivere

- [ ] Da utente al primo utilizzo del diario, aprilo → notifica di consenso
      che nomina OpenAI viene mostrata prima che qualsiasi registrazione sia
      possibile.
- [ ] Conferma il consenso, registra un breve messaggio, ferma → appare un
      transcript che corrisponde a quanto detto.
- [ ] Ripeti con la rete disabilitata subito dopo aver fermato → messaggio
      chiaro "serve una connessione"; il retry una volta riconnessi ha
      successo senza dover registrare di nuovo.

### Scenario 2 — Ricevi una riflessione sul mood

- [ ] Continuando da una registrazione riuscita → mood summary + breve
      feedback appaiono insieme al transcript automaticamente.
- [ ] Simula il solo passaggio di analisi mood che fallisce (es. rompi
      temporaneamente il nome del modello in
      `supabase/functions/journal-process/index.ts` e rifai il deploy)
      mentre la trascrizione continua a funzionare → il transcript resta
      visibile, un'azione "retry mood analysis" è disponibile e ha successo
      una volta sistemato.

### Scenario 3 — Rivedi le voci passate

- [ ] Con diverse voci registrate, apri lo storico → più recenti per prime,
      ognuna con transcript/mood/feedback.
- [ ] Elimina una voce → sparisce subito, non ricompare al refresh.
- [ ] Da utente nuovo, apri lo storico → stato vuoto, non un errore.

### Verifica privacy — l'audio non persiste mai

- [ ] Dopo che una registrazione finisce di essere processata, verifica: nessun
      file audio temporaneo locale residuo, nessun bucket Supabase Storage per
      questa feature, e la riga in `journal_entries` non ha colonna/valore
      audio — solo testo di transcript/mood.

---

## Parte D — `006-now-next-widget` (widget Android)

*Usa la stessa development build della Parte A — nessun account/secret
separato da configurare.*

### Scenario 1 — Vedi cosa c'è ora e dopo senza aprire l'app

- [ ] Con un'attività in corso e un'altra più tardi oggi
      (`003-timeline-visualization`), aggiungi il widget: tieni premuto sulla
      home → Widget → Foxus → trascina "Now & Next" sulla home → mostra
      correttamente l'attuale + la prossima.
- [ ] Cancella le attività di oggi (o usa un account nuovo) → il widget
      mostra chiaramente "niente in programma", non vuoto/rotto.
- [ ] Con solo un'attività più tardi, niente in corso → il widget mostra
      "niente in questo momento" + la prossima attività.

### Scenario 2 — Il widget si aggiorna da solo

- [ ] Con il widget che mostra un'attività in corso, aspetta oltre il suo
      orario di fine (e l'inizio della prossima) **senza aprire l'app** →
      entro 30 minuti, il widget si aggiorna da solo.
- [ ] Disattiva la rete, aspetta durante una transizione, riattivala → il
      widget si allinea allo stato corretto al refresh successivo.

### Scenario 3 — Passa all'app dal widget

- [ ] Tocca il widget → l'app si apre direttamente sul timeline, in meno di
      circa 2 secondi.

### Verifica utente non autenticato

- [ ] Esci dall'app, controlla il widget (potrebbe servire un ciclo di
      refresh) → stato neutro "accedi per vedere il tuo programma", mai un
      errore/crash/widget vuoto.

---

## Parte E — `007-lockscreen-timeline` (notifica lock screen)

*Usa la stessa development build della Parte A. Richiede il permesso notifiche
su Android 13+.*

### Scenario 1 — Attiva e verifica sul lock screen

- [ ] Impostazioni → attiva "Timeline sul lock screen" → concedi il permesso
      notifiche se richiesto.
- [ ] Blocca lo schermo → la notifica appare, sotto le altre notifiche e sotto
      data/ora, senza dover sbloccare.
- [ ] Con un'attività in corso → mostra "Ora: <titolo>" e la barra di
      avanzamento coerente con l'orario reale.
- [ ] Espandi la notifica → vedi anche la prossima attività (se presente).

### Scenario 2 — Si aggiorna da sola

- [ ] Con la notifica attiva, aspetta oltre il cambio di attività **senza
      aprire l'app** → entro ~15-30 minuti si aggiorna da sola (limite di
      Android sul lavoro in background, non scelta del prodotto).

### Scenario 3 — Disattiva

- [ ] Impostazioni → disattiva il toggle → la notifica sparisce subito e non
      ricompare.

---

## Quando tutto sopra è spuntato

- [ ] Aggiorna il `tasks.md` di ogni feature, portando le task `⏸️`/in
      sospeso rimanenti a `[X]`:
  - `specs/004-subscription-monetization/tasks.md`: T010, T013, T017
  - `specs/005-ai-voice-journal/tasks.md`: T006 (deploy), T019 (quickstart
    completo)
  - `specs/006-now-next-widget/tasks.md`: T007, T009, T011, T012
- [ ] Se qualcosa fallisce, annotalo qui o apri una nuova task/issue invece di
      annullare in silenzio il codice — poi questo file può essere cancellato
      una volta che tutto è verde e committato.
