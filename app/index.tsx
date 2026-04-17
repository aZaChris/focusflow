import { Redirect } from 'expo-router';

/**
 * Punto di ingresso principale dell'applicazione.
 * Attualmente si occupa di reindirizzare l'utente verso la schermata principale (Tabs).
 * 
 * In una versione futura, questo file gestirà la logica di guard per l'autenticazione:
 * - Se loggato -> Vai a /today
 * - Se non loggato -> Vai a /login
 */
export default function Index() {
  return <Redirect href="/(tabs)/today" />;
}
