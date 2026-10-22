import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Typography';
import { WaterBody } from '../components/WaterBody';
import { useWaterIntake } from '../store/useWaterIntake';
import { useTheme } from '../theme/ThemeContext';

export default function WaterIntakeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { current, goal, changeIntake, reset, save, loading, saving, dirty, error } = useWaterIntake();
  const surface = theme.dark ? '#17235C' : '#FFFFFF';
  const muted = theme.dark ? '#C4CBE4' : '#66769B';

  const addWater = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    changeIntake(250);
  };

  return (
    <LinearGradient colors={theme.dark ? theme.gradient : ['#F7EEFB', '#F7EEFB']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: surface }]}>
            <Ionicons name="chevron-back" size={21} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Water intake</Text>
          <View style={styles.headerSpace} />
        </View>

        <View style={styles.bodyWrap}>
          <WaterBody current={current} goal={goal} />
        </View>

        <View style={[styles.progressCard, { backgroundColor: surface }]}>
          <Text style={[styles.progressLabel, { color: muted }]}>TODAY&apos;S INTAKE</Text>
          <Text style={[styles.progressValue, { color: theme.text }]}>{(current / 1000).toFixed(2)} <Text style={{ color: muted, fontSize: 17 }}>of {(goal / 1000).toFixed(0)} L</Text></Text>
          {current >= goal ? <Text style={[styles.goalMessage, { color: theme.primary }]}>Goal reached! Great job staying hydrated.</Text> : <Text style={[styles.goalMessage, { color: muted }]}>{((goal - current) / 1000).toFixed(2)} L left to reach your goal</Text>}
        </View>

        {loading ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={{ color: muted, fontSize: 12, marginLeft: 8 }}>Loading your water history…</Text></View> : null}
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.dark ? '#FFB4AB' : '#B42318' }]}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => changeIntake(-250)} style={[styles.adjustButton, { backgroundColor: surface }]}>
            <Ionicons name="remove" size={19} color={theme.text} />
            <Text style={[styles.adjustText, { color: theme.text }]}>250 ml</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={addWater} style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={20} color={theme.dark ? '#0A0F2C' : '#FFFFFF'} />
            <Text style={[styles.addText, { color: theme.dark ? '#0A0F2C' : '#FFFFFF' }]}>250 ml</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={reset} style={styles.resetButton}>
          <Text style={[styles.resetText, { color: muted }]}>Reset today</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!dirty || saving} onPress={() => void save().then(ok => {
          if (ok) Alert.alert('Saved', 'Today\'s water intake was saved to your account.');
        })} style={[styles.saveButton, { backgroundColor: dirty ? theme.primary : '#8796B3', opacity: saving ? 0.7 : 1 }]}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : dirty ? 'Save water intake' : 'All changes saved'}</Text>
        </Pressable>
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  headerSpace: { width: 38 },
  bodyWrap: { flex: 1, minHeight: 340, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  progressCard: { borderRadius: 18, padding: 17, marginBottom: 17 },
  progressLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  progressValue: { fontSize: 28, fontWeight: '800', marginTop: 5 },
  goalMessage: { fontSize: 12, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 12 },
  adjustButton: { flex: 1, minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  adjustText: { fontSize: 14, fontWeight: '700' },
  addButton: { flex: 1.4, minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addText: { fontSize: 14, fontWeight: '700' },
  resetButton: { alignSelf: 'center', padding: 13, marginTop: 4 },
  resetText: { fontSize: 12, textDecorationLine: 'underline' },
  saveButton: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  error: { fontSize: 12, textAlign: 'center', marginBottom: 10 },
});
