import 'react-native-gesture-handler';
// import 'react-native-reanimated'; // DISABILITATO TEMPORANEAMENTE PER EXPO GO
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

/**
 * RootLayout: Il componente base che avvolge l'intera applicazione.
 * Gestisce i provider globali (Gesture, SafeArea) e la navigazione principale.
 */
export default function RootLayout() {
  return (
    // GestureHandlerRootView è necessario per le animazioni di Reanimated e Gesture Handler
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* StatusBar configura l'aspetto della barra di stato del dispositivo */}
        <StatusBar style="light" />
        
        {/* Stack gestisce la navigazione tra i grandi rami dell'app (Auth vs Contenuto principale) */}
        <Stack
          screenOptions={{
            headerShown: false, // Nascondiamo l'header di default per usare UI custom
            animation: 'fade',   // Animazione di transizione fluida tra i moduli
          }}
        >
          {/* Rotta iniziale: reindirizza o mostra la home */}
          <Stack.Screen name="index" />
          
          {/* Gruppo di rotte per l'autenticazione */}
          <Stack.Screen name="(auth)" />
          
          {/* Gruppo di rotte per l'area principale a tab */}
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
