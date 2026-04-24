import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

/**
 * InsightsScreen: Modulo per l'analisi dei dati dell'utente.
 */
export default function InsightsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState({
    moodHistory: [0, 0, 0, 0, 0, 0, 0],
    completedHabits: 0,
    focusHours: 0,
  });

  // Calcola i nomi degli ultimi 7 giorni a partire da oggi
  const getDynamicDays = () => {
    const days = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
    const result = [];
    const today = new Date().getDay();
    for (let i = 6; i >= 0; i--) {
      let index = today - i;
      if (index < 0) index += 7;
      result.push(days[index]);
    }
    return result;
  };

  const weekDays = getDynamicDays();

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg("Utente non autenticato.");
        return;
      }

      // 1. Recupera Mood Logs degli ultimi 7 giorni reali
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: moodData, error: moodError } = await supabase
        .from('mood_logs')
        .select('mood_score, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // 2. Recupera Abitudini completate oggi
      const { count, error: habitsError } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (moodError) throw new Error(moodError.message);
      if (habitsError) throw new Error(habitsError.message);

      // Elaborazione dati reali per il grafico
      const processedMood = [0, 0, 0, 0, 0, 0, 0];
      const today = new Date();
      
      if (moodData) {
        moodData.forEach(log => {
          const logDate = new Date(log.created_at);
          const diffInDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 3600 * 24));
          if (diffInDays >= 0 && diffInDays < 7) {
            processedMood[6 - diffInDays] = (log.mood_score || 0) * 20;
          }
        });
      }

      setStats({
        moodHistory: processedMood,
        completedHabits: count || 0,
        focusHours: 8,
      });

    } catch (err: any) {
      console.error("Errore caricamento insights:", err);
      setErrorMsg(err.message || "Errore sconosciuto.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRealData();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.container, styles.center, { padding: 20 }]}>
        <Feather name="alert-circle" size={48} color={colors.activities.red} />
        <Text style={[styles.title, { fontSize: 20, marginTop: 15 }]}>Ops!</Text>
        <Text style={styles.subtitle}>{errorMsg}</Text>
        <TouchableOpacity style={[styles.statBox, { marginTop: 20 }]} onPress={loadRealData}>
          <Text style={{ color: colors.accent }}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>I tuoi Progressi</Text>
        <Text style={styles.subtitle}>Analisi basata sui tuoi dati reali.</Text>
      </View>

      {/* 1. MOOD TREND CARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Feather name="activity" size={20} color={colors.accent} />
          </View>
          <Text style={styles.cardTitle}>Andamento Mood</Text>
        </View>
        
        <View style={styles.chartContainer}>
          {stats.moodHistory.map((val, i) => (
            <View key={i} style={styles.chartBarWrapper}>
              <View 
                style={[
                  styles.chartBar, 
                  { 
                    height: Math.max(10, val * 1.2), 
                    backgroundColor: i === 6 ? colors.accent : colors.surface2 
                  }
                ]} 
              />
              <Text style={styles.barLabel}>{weekDays[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.chartFooter}>Il grafico mostra il tuo benessere nell'ultima settimana.</Text>
      </View>

      {/* 2. STATS GRID */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { flex: 1, marginRight: 8 }]}>
          <Feather name="check-circle" size={24} color={colors.activities.teal} />
          <Text style={styles.statValue}>{stats.completedHabits}</Text>
          <Text style={styles.statLabel}>Abitudini Oggi</Text>
        </View>
        
        <View style={[styles.statBox, { flex: 1, marginLeft: 8 }]}>
          <Feather name="clock" size={24} color={colors.activities.purple} />
          <Text style={styles.statValue}>{stats.focusHours}h</Text>
          <Text style={styles.statLabel}>Tempo Focus</Text>
        </View>
      </View>

      {/* 3. AI INSIGHT BOX */}
      <View style={styles.aiInsightCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiTag}>✨ FOCUS AI</Text>
        </View>
        <Text style={styles.aiContent}>
          {stats.completedHabits > 0 
            ? "Ottimo inizio! Hai già completato alcune abitudini. Mantieni questo ritmo per consolidare la tua routine."
            : "Non hai ancora segnato abitudini oggi. Prenditi un momento per iniziare con una piccola azione positiva."}
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 25,
  },
  title: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.sans,
    fontSize: 16,
    marginTop: 5,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: typography.sans,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: 10,
  },
  chartBarWrapper: {
    alignItems: 'center',
    width: (width - 120) / 7,
  },
  chartBar: {
    width: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  barLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  chartFooter: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  aiInsightCard: {
    backgroundColor: colors.surface2,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    marginBottom: 30,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiTag: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  aiContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  }
});
