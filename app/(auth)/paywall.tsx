import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { router } from 'expo-router';

/**
 * PaywallScreen: Schermata per la vendita dell'abbonamento PRO.
 * Presenta i vantaggi e gestisce l'acquisto tramite RevenueCat.
 */
export default function PaywallScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const features = [
    { icon: 'mic', title: 'Diario Vocale Illimitato', desc: 'Registra e trascrivi senza limiti.' },
    { icon: 'cpu', title: 'Analisi AI Avanzata', desc: 'Ricevi feedback profondi sul tuo mood.' },
    { icon: 'layout', title: 'Widget Personalizzati', desc: 'Configura la timeline sulla tua Home.' },
    { icon: 'cloud', title: 'Cloud Sync', desc: 'Dati sincronizzati e sicuri su ogni device.' },
  ];

  const handlePurchase = async () => {
    setLoading(true);
    // Simulazione acquisto
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Abbonamento Attivo", "Benvenuto nel club Pro! Tutte le funzionalità sono ora sbloccate.", [
        { text: "Inizia", onPress: () => router.replace('/(tabs)/today') }
      ]);
    }, 2000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>FocusFlow PRO</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Sblocca il pieno potenziale del tuo tempo.</Text>
      </View>

      <View style={styles.featuresGrid}>
        {features.map((f, i) => (
          <Card key={i} style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryDim }]}>
              <Feather name={f.icon as any} size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: theme.colors.text, fontFamily: theme.typography.sans }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: theme.colors.textMuted }]}>{f.desc}</Text>
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.pricingSection}>
        <Card style={[styles.pricingCard, { borderColor: theme.colors.primary }]}>
          <View style={[styles.bestValuePill, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.bestValueText, { color: theme.colors.background }]}>MIGLIOR VALORE</Text>
          </View>
          <Text style={[styles.planName, { color: theme.colors.textMuted }]}>Annuale</Text>
          <Text style={[styles.price, { color: theme.colors.text }]}>€29,99 / anno</Text>
          <Text style={[styles.priceDesc, { color: theme.colors.textMuted }]}>Meno di €2,50 al mese</Text>
        </Card>

        <Button 
          title="Prova Gratis per 7 Giorni" 
          onPress={handlePurchase} 
          loading={loading}
          style={styles.ctaBtn}
        />
        
        <Text style={[styles.disclaimer, { color: theme.colors.textMuted }]}>
          Annulla quando vuoi. Dopo il periodo di prova, €29,99/anno.
        </Text>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 25, alignItems: 'center' },
  closeBtn: { alignSelf: 'flex-end', padding: 5 },
  title: { fontSize: 32, fontWeight: 'bold', marginTop: 20 },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  featuresGrid: { padding: 20, gap: 15 },
  featureCard: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: 'bold' },
  featureDesc: { fontSize: 13, marginTop: 2 },
  pricingSection: { padding: 20, alignItems: 'center' },
  pricingCard: { width: '100%', alignItems: 'center', padding: 25, borderWidth: 2, marginBottom: 20 },
  bestValuePill: { position: 'absolute', top: -12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  bestValueText: { fontSize: 10, fontWeight: 'bold' },
  planName: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  price: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  priceDesc: { fontSize: 12 },
  ctaBtn: { width: '100%', marginBottom: 15 },
  disclaimer: { fontSize: 11, textAlign: 'center' }
});
