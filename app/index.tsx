import { Redirect } from 'expo-router';

export default function Index() {
  // In una fase successiva qui controlleremo lo stato di auth con Supabase.
  // Per ora reindirizziamo alla schermata (tabs) che è il cuore dell'app.
  return <Redirect href="/(tabs)/today" />;
}
