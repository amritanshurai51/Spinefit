import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { useTheme } from '../theme/ThemeContext';

export default function WellnessTipsScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.dark ? 'rgba(23,35,92,0.88)' : '#FCEFFC', borderColor: theme.dark ? '#3A4690' : '#F6B5EC' }]}>
          <View style={styles.artwork}>
            <LinearGradient colors={theme.dark ? ['#3A4690', '#222B63'] : ['#F8E8FB', '#FCEFFC']} style={StyleSheet.absoluteFill} />
            <View style={[styles.iconCircle, { backgroundColor: theme.dark ? '#17235C' : 'rgba(255,255,255,0.74)' }]}>
              <Ionicons name="leaf-outline" size={37} color={theme.dark ? '#F4F1FF' : '#183675'} />
            </View>
            <Ionicons name="sparkles" size={19} color={theme.dark ? '#F0A9F5' : '#C45BBE'} style={styles.sparkleTop} />
            <Ionicons name="sparkles" size={13} color={theme.dark ? '#A9B2D6' : '#8A9AD0'} style={styles.sparkleSide} />
          </View>
          <Text style={{ color: theme.text, fontSize: 25, fontWeight: '700', textAlign: 'center' }}>Coming Soon</Text>
          <View style={[styles.accent, { backgroundColor: theme.accent }]} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 350, minHeight: 270, alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 28, borderWidth: 1, shadowColor: '#12316B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 5 },
  artwork: { width: 144, height: 128, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderRadius: 30, overflow: 'hidden' },
  iconCircle: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', shadowColor: '#12316B', shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 },
  sparkleTop: { position: 'absolute', top: 19, right: 21 },
  sparkleSide: { position: 'absolute', bottom: 25, left: 19 },
  accent: { width: 42, height: 4, borderRadius: 2, marginTop: 16 },
});
