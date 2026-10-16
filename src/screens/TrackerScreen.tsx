import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Text } from '../components/Typography';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { Screen } from '../components/ui';
import { useTheme } from '../theme/ThemeContext';
import { registerForNotifications, setReminder } from '../services/notifications';

const STEP_GOAL = 8000, WATER_GOAL = 8, GLASS_ML = 250;
const REM = [
  { k: 'steps', icon: 'walk', title: 'Step goal check-in', sub: 'Every 2 hours, 9am-6pm' },
  { k: 'water', icon: 'water', title: 'Water reminder', sub: 'Every 90 minutes' },
  { k: 'exercise', icon: 'time-outline', title: 'Daily exercise reminder', sub: 'A nudge to do your routine' },
];

export default function TrackerScreen() {
  const { theme } = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const [steps, setSteps] = useState(0); const [glasses, setGlasses] = useState(0);
  const [on, setOn] = useState<Record<string, boolean>>({ steps: false, water: false, exercise: false });

  useEffect(() => {
    AsyncStorage.getItem('water:' + today).then(v => v && setGlasses(+v));
    AsyncStorage.getItem('reminders').then(v => v && setOn(JSON.parse(v)));
    syncSteps();
  }, []);

  const syncSteps = async () => {
    try {
      if (!(await Pedometer.isAvailableAsync())) return;
      const start = new Date(); start.setHours(0, 0, 0, 0);
      setSteps((await Pedometer.getStepCountAsync(start, new Date())).steps);
    } catch {}
  };
  const addWater = (d: number) => { const n = Math.max(0, Math.min(20, glasses + d)); setGlasses(n); AsyncStorage.setItem('water:' + today, String(n)); };
  const toggle = async (k: string, v: boolean) => {
    if (v && !(await registerForNotifications())) { /* simulator/permission denied: still schedule locally */ }
    const next = { ...on, [k]: v }; setOn(next); AsyncStorage.setItem('reminders', JSON.stringify(next)); setReminder(k, v);
  };

  const card = { backgroundColor: theme.card, borderRadius: 22, padding: 18, marginTop: 10 } as const;
  const white = { color: '#fff' } as const;
  const pct = Math.min(100, Math.round((steps / STEP_GOAL) * 100));
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>Today</Text>
        <Text style={{ color: theme.subtext }}>{new Date().toDateString()}</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Steps</Text><Text style={{ color: theme.text }}>Goal : {STEP_GOAL}</Text>
        </View>
        <View style={[card, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 8, borderColor: '#F3D58B', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[white, { fontWeight: '800', fontSize: 18 }]}>{pct}%</Text><Text style={[white, { fontSize: 10 }]}>of goal</Text>
          </View>
          <View style={{ marginLeft: 18 }}>
            <Text style={{ color: '#C9D1F5' }}>Steps today</Text>
            <Text style={[white, { fontSize: 28, fontWeight: '800' }]}>{steps.toLocaleString()}</Text>
            <Text style={{ color: '#C9D1F5', fontSize: 12 }}>{Math.max(0, STEP_GOAL - steps).toLocaleString()} to go</Text>
            <Pressable onPress={syncSteps} style={{ marginTop: 8, borderWidth: 1, borderColor: '#ffffff55', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={[white, { fontSize: 12 }]}>⟳ Sync now</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Water Intake</Text><Text style={{ color: theme.text }}>Goal : {WATER_GOAL} Glasses</Text>
        </View>
        <View style={card}>
          <Text style={[white, { fontSize: 22, fontWeight: '800' }]}>{(glasses * GLASS_ML / 1000).toFixed(2)} L <Text style={{ fontSize: 12, fontWeight: '400', color: '#C9D1F5' }}>of {WATER_GOAL * GLASS_ML / 1000} L daily goal</Text></Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 }}>
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <Ionicons key={i} name="water" size={22} color={i < glasses ? '#4CC9FF' : '#ffffff33'} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Pressable onPress={() => addWater(-1)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="remove" size={22} color="#fff" /></Pressable>
            <View style={{ marginHorizontal: 24, alignItems: 'center' }}><Text style={[white, { fontWeight: '700' }]}>1 glass = {GLASS_ML} ml</Text><Text style={{ color: '#C9D1F5', fontSize: 11 }}>Tap + to log</Text></View>
            <Pressable onPress={() => addWater(1)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#25B7FF', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="add" size={22} color="#fff" /></Pressable>
          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 22 }}>Reminders</Text>
        <View style={card}>
          {REM.map(r => (
            <View key={r.k} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#F3D6F7', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={r.icon as any} size={20} color="#14306B" /></View>
              <View style={{ flex: 1, marginLeft: 12 }}><Text style={[white, { fontWeight: '700' }]}>{r.title}</Text><Text style={{ color: '#C9D1F5', fontSize: 12 }}>{r.sub}</Text></View>
              <Switch value={on[r.k]} onValueChange={v => toggle(r.k, v)} trackColor={{ true: '#E879F9', false: '#3A4690' }} thumbColor="#fff" />
            </View>
          ))}
          <Text style={{ color: '#C9D1F5', fontSize: 12, marginTop: 4 }}>🌙 Quiet hours: no reminders 9 PM - 7 AM</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
