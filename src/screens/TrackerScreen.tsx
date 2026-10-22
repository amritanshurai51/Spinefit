import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Circle, Svg } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { useTheme } from '../theme/ThemeContext';
import { registerForNotifications, setReminder } from '../services/notifications';
import { WaterBody } from '../components/WaterBody';
import { useWaterIntake, WATER_GLASS_ML } from '../store/useWaterIntake';

const STEP_GOAL = 8000;
const WATER_GOAL = 12;
const GLASS_ML = WATER_GLASS_ML;

const REMINDERS = [
  { key: 'steps', icon: 'walk', title: 'Step goal check-in', subtitle: 'Every 2 hours, 9am–6pm' },
  { key: 'water', icon: 'water', title: 'Water reminder', subtitle: 'Every 90 minutes' },
  { key: 'exercise', icon: 'time-outline', title: 'Daily exercise reminder', subtitle: 'A nudge to do your routine' },
];

type TrackerView = 'dashboard' | 'steps' | 'water';
type DayValue = { date: Date; label: string; value: number };

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dayLabel = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const weekDates = (today: Date) => Array.from({ length: 7 }, (_, index) => {
  const date = new Date(today);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 6 + index);
  return date;
});

export default function TrackerScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [view, setView] = useState<TrackerView>('dashboard');
  const [steps, setSteps] = useState(0);
  const { glasses, current: todayWater, changeIntake, week: savedWaterWeek, save: saveWater, saving: savingWater, dirty: waterDirty, error: waterError, reload: reloadWater } = useWaterIntake();
  const [stepWeek, setStepWeek] = useState<DayValue[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState<Record<string, boolean>>({ steps: true, water: false, exercise: true });
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { void reloadWater(); });
    return unsubscribe;
  }, [navigation, reloadWater]);
  const stepPercent = Math.min(100, Math.round((steps / STEP_GOAL) * 100));
  const waterPercent = Math.min(100, Math.round((glasses / WATER_GOAL) * 100));
  const weekLabel = `${weekDates(today)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const syncSteps = useCallback(async () => {
    try {
      if (!(await Pedometer.isAvailableAsync())) return;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const result = await Pedometer.getStepCountAsync(start, new Date());
      setSteps(result.steps);
      setStepWeek(current => current.map(day => dateKey(day.date) === todayKey ? { ...day, value: result.steps } : day));
    } catch {
      // Keep the last value when the sensor is unavailable or permission is denied.
    }
  }, [todayKey]);

  const waterWeek: DayValue[] = savedWaterWeek.map(({ day, water_ml }) => {
    const [year, month, date] = day.split('-').map(Number);
    const localDay = new Date(year, month - 1, date);
    return { date: localDay, label: dayLabel(localDay), value: water_ml / 1000 };
  }).map(day => dateKey(day.date) === todayKey && waterDirty
    ? { ...day, value: todayWater / 1000 }
    : day);

  const loadStepWeek = useCallback(async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      const dates = weekDates(today);
      const values = await Promise.all(dates.map(async date => {
        if (!available) return { date, label: dayLabel(date), value: 0 };
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);
        if (dateKey(date) === todayKey) end.setTime(Date.now());
        if (end <= start) return { date, label: dayLabel(date), value: 0 };
        try {
          const result = await Pedometer.getStepCountAsync(start, end);
          return { date, label: dayLabel(date), value: result.steps };
        } catch {
          return { date, label: dayLabel(date), value: 0 };
        }
      }));
      setStepWeek(values);
    } catch {
      setStepWeek(weekDates(today).map(date => ({ date, label: dayLabel(date), value: 0 })));
    }
  }, [today, todayKey]);

  useEffect(() => {
    AsyncStorage.getItem('reminders').then(saved => {
      if (saved) setReminderEnabled({ steps: true, water: false, exercise: true, ...JSON.parse(saved) });
    }).catch(() => {});
    void syncSteps();
    void loadStepWeek();
  }, [todayKey, syncSteps, loadStepWeek]);

  const addWater = (amount: number) => {
    changeIntake(amount * GLASS_ML);
  };

  const toggleReminder = async (key: string, enabled: boolean) => {
    if (enabled) {
      try { await registerForNotifications(); } catch { /* Saving the preference still works without permission. */ }
    }
    const next = { ...reminderEnabled, [key]: enabled };
    setReminderEnabled(next);
    await AsyncStorage.setItem('reminders', JSON.stringify(next)).catch(() => {});
    void setReminder(key, enabled).catch(error => console.warn('Could not update reminder:', error));
  };

  const background = theme.dark ? ['#171D50', '#0A1740'] as const : ['#F7D7F5', '#FCEBFB'] as const;
  const panel = theme.dark ? ['#152960', '#0B3D83'] as const : ['#104B9B', '#082E6F'] as const;
  const navy = '#123B82';
  const mutedOnPanel = '#CED8F4';

  const progressRing = (percent: number, size: number, color: string, center: React.ReactNode) => (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
        <Circle cx="50" cy="50" r="43" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 43}`} strokeDashoffset={`${2 * Math.PI * 43 * (1 - percent / 100)}`} rotation="-90" origin="50, 50" />
      </Svg>
      {center}
    </View>
  );

  const waterControl = (compact = false) => (
    <View style={{ height: compact ? 52 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 30, paddingHorizontal: 9, backgroundColor: '#0E448F' }}>
      <Pressable onPress={() => addWater(-1)} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#255493', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
        <Ionicons name="remove" size={21} color="#DDE9FF" />
      </Pressable>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{glasses} {glasses === 1 ? 'glass' : 'glasses'}</Text>
        <Text style={{ color: '#C8D6F2', fontSize: 10, marginTop: 2 }}>Tap glass when sip</Text>
      </View>
      <Pressable onPress={() => addWater(1)} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0CA8EE' }}>
        <Ionicons name="water" size={19} color="#fff" />
      </Pressable>
    </View>
  );

  const stepChart = (data: DayValue[], compact = false) => {
    const chartHeight = compact ? 104 : 146;
    const maxValue = Math.max(STEP_GOAL, ...data.map(day => day.value), 1);
    return (
      <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 18 }}>
        {data.map((day, index) => {
          const height = Math.max(12, (day.value / maxValue) * (chartHeight - 45));
          const isToday = dateKey(day.date) === todayKey;
          return (
            <View key={dateKey(day.date)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <Text style={{ color: isToday ? '#FFE6A6' : '#C8D5F2', fontSize: 8, marginBottom: 4 }}>{day.value ? formatCompact(day.value) : ''}</Text>
              <View style={{ width: compact ? 20 : 26, height, borderRadius: 7, backgroundColor: isToday ? '#F2D486' : index === 3 ? '#5DC9F2' : '#F2B6F1' }} />
              <Text style={{ color: '#E3E9FB', fontSize: 8, marginTop: 5 }}>{day.label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const waterChart = () => {
    const chartHeight = 165;
    const maxValue = Math.max(2, ...waterWeek.map(day => day.value));
    return (
      <View style={{ height: chartHeight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 18 }}>
        {waterWeek.map(day => {
          const isToday = dateKey(day.date) === todayKey;
          const height = Math.max(8, (day.value / maxValue) * 91);
          const reached = day.value >= WATER_GOAL * GLASS_ML / 1000;
          return (
            <View key={dateKey(day.date)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <Text style={{ color: isToday ? '#FFE5A7' : '#D8E1F7', fontSize: 9, marginBottom: 5 }}>{day.value.toFixed(1)}</Text>
              <View style={{ width: 23, height, borderRadius: 7, backgroundColor: isToday ? '#F2D486' : reached ? '#45C4EE' : '#817FE2' }} />
              <Text style={{ color: '#EDF0FA', fontSize: 8, marginTop: 7 }}>{day.label}</Text>
              <Text style={{ color: '#B9C7E9', fontSize: 8 }}>{day.date.getDate()}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderDashboard = () => (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>Today</Text>
          <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 3 }}>{today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 11 }}>
          <Ionicons name="calendar-outline" size={13} color={navy} /><Text style={{ color: navy, fontSize: 9, fontWeight: '700', marginLeft: 5 }}>This week</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 7 }}>
        <Pressable onPress={() => setView('steps')}><Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Steps</Text></Pressable>
        <Pressable onPress={() => setView('steps')} style={editPill}><Ionicons name="create-outline" size={11} color={navy} /><Text style={editText}>Edit</Text></Pressable>
      </View>
      <LinearGradient colors={panel} style={dashboardCard}>
        <Pressable onPress={() => setView('steps')} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {progressRing(stepPercent, 78, '#F3D486', <View style={{ alignItems: 'center' }}><Ionicons name="walk" size={18} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginTop: 1 }}>{stepPercent}%</Text><Text style={{ color: '#D6E0F6', fontSize: 7 }}>of goal</Text></View>)}
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={{ color: mutedOnPanel, fontSize: 9 }}>Steps today</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 1 }}>{steps.toLocaleString()}</Text>
            <Text style={{ color: '#D3DDF2', fontSize: 9 }}>{Math.max(0, STEP_GOAL - steps).toLocaleString()} to go</Text>
          </View>
          <Ionicons name="chevron-forward-circle-outline" size={17} color="#C8D6F2" />
        </Pressable>
        <Pressable onPress={() => void syncSteps()} style={syncPill}><Ionicons name="sync-outline" size={11} color="#fff" /><Text style={{ color: '#fff', fontSize: 9, marginLeft: 4 }}>Sync now</Text></Pressable>
      </LinearGradient>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 19, marginBottom: 7 }}>
        <Pressable onPress={() => setView('water')}><Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Water Intake</Text></Pressable>
        <Pressable onPress={() => setView('water')} style={editPill}><Ionicons name="create-outline" size={11} color={navy} /><Text style={editText}>Edit</Text></Pressable>
      </View>
      <LinearGradient colors={panel} style={dashboardCard}>
        <Pressable onPress={() => setView('water')} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {progressRing(waterPercent, 68, '#59D4FB', <View style={{ alignItems: 'center' }}><Ionicons name="water" size={15} color="#fff" /><Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{glasses}/{WATER_GOAL}</Text><Text style={{ color: '#D6E0F6', fontSize: 6 }}>glasses</Text></View>)}
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: mutedOnPanel, fontSize: 9 }}>Water logged</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginVertical: 2 }}>{(todayWater / 1000).toFixed(2)} L</Text>
            <Text style={{ color: '#D3DDF2', fontSize: 9 }}>of {WATER_GOAL * GLASS_ML / 1000} L daily goal</Text>
          </View>
          <Ionicons name="chevron-forward-circle-outline" size={17} color="#C8D6F2" />
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12, paddingHorizontal: 1 }}>
          {Array.from({ length: WATER_GOAL }).map((_, index) => <View key={index} style={{ width: 23, height: 24, borderRadius: 6, backgroundColor: index < glasses ? 'rgba(81,211,250,0.25)' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: index < glasses ? '#55D3F6' : 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="water" size={13} color={index < glasses ? '#69DCFC' : '#A6B7D9'} /></View>)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => addWater(-1)} style={smallControl}><Ionicons name="remove" size={18} color="#fff" /></Pressable>
          <Pressable onPress={() => setView('water')} style={{ alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{glasses} {glasses === 1 ? 'glass' : 'glasses'}</Text><Text style={{ color: mutedOnPanel, fontSize: 8, marginTop: 2 }}>Tap + to log</Text></Pressable>
          <Pressable onPress={() => addWater(1)} style={[smallControl, { backgroundColor: '#10B6F3', borderColor: 'transparent' }]}><Ionicons name="add" size={18} color="#fff" /></Pressable>
        </View>
      </LinearGradient>

      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 21, marginBottom: 7 }}>Reminders</Text>
      <LinearGradient colors={panel} style={{ borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 }}>
        {REMINDERS.map(reminder => (
          <View key={reminder.key} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: reminder.key === 'exercise' ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.09)' }}>
            <View style={reminderIcon}><Ionicons name={reminder.icon as any} size={15} color="#F1D0F6" /></View>
            <View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{reminder.title}</Text><Text style={{ color: mutedOnPanel, fontSize: 8, marginTop: 2 }}>{reminder.subtitle}</Text></View>
            <Switch value={!!reminderEnabled[reminder.key]} onValueChange={enabled => void toggleReminder(reminder.key, enabled)} trackColor={{ true: '#E879F9', false: '#53658A' }} thumbColor="#fff" />
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 7 }}><View style={reminderIcon}><Ionicons name="moon-outline" size={15} color="#F1D0F6" /></View><View style={{ marginLeft: 10 }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Quiet hours</Text><Text style={{ color: mutedOnPanel, fontSize: 8, marginTop: 2 }}>No reminders 9 PM – 7 AM</Text></View></View>
      </LinearGradient>
    </>
  );

  const renderSteps = () => (
    <>
      <DetailHeader title="Steps" onBack={() => setView('dashboard')} />
      <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 17 }}>
        {progressRing(stepPercent, 116, '#E5B900', <View style={{ alignItems: 'center' }}><Ionicons name="walk" size={19} color={navy} /><Text style={{ color: navy, fontSize: 15, fontWeight: '800', marginTop: 1 }}>{stepPercent}%</Text><Text style={{ color: '#62739B', fontSize: 9 }}>of goal</Text></View>)}
        <Text style={{ color: '#344F85', fontSize: 25, fontWeight: '800', marginTop: 15 }}>{steps.toLocaleString()}</Text>
        <Text style={{ color: '#536A99', fontSize: 12 }}>{Math.max(0, STEP_GOAL - steps).toLocaleString()} to go</Text>
        <Pressable onPress={() => void syncSteps()} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 7, paddingHorizontal: 13, marginTop: 9 }}><Ionicons name="sync-outline" size={11} color={navy} /><Text style={{ color: navy, fontSize: 9, marginLeft: 4 }}>Sync now</Text></Pressable>
        <Text style={{ color: theme.subtext, fontSize: 9, marginTop: 11 }}>Last synced at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, marginBottom: 19 }}>
        <StatCard icon="walk" value={`${(steps * 0.00071).toFixed(1)}`} unit="km" colors={panel} />
        <StatCard icon="flame" value={`${Math.round(steps * 0.038)}`} unit="kcal" colors={panel} />
        <StatCard icon="stopwatch-outline" value={`${Math.round(steps / 125)}`} unit="Active min" colors={panel} />
      </View>
      <LinearGradient colors={panel} style={{ borderRadius: 21, padding: 16, marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Daily Steps</Text><Text style={{ color: mutedOnPanel, fontSize: 9, marginTop: 3 }}>Average {Math.round(stepWeek.reduce((sum, day) => sum + day.value, 0) / Math.max(1, stepWeek.length)).toLocaleString()} steps a day</Text></View>
          <View style={{ borderWidth: 1, borderColor: '#ffffff55', borderRadius: 16, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}><Ionicons name="options-outline" size={12} color="#fff" /><Text style={{ color: '#fff', fontSize: 9, marginLeft: 4 }}>7 Days</Text></View>
        </View>
        <View style={{ marginTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#ffffff44' }} />
        {stepChart(stepWeek)}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}><Text style={legendText}><Text style={{ color: '#F2B6F1' }}>■</Text> Goal progress</Text><Text style={legendText}><Text style={{ color: '#F2D486' }}>■</Text> Today</Text><Text style={legendText}>Goal 8,000</Text></View>
      </LinearGradient>
    </>
  );

  const renderWater = () => (
    <>
      <DetailHeader title="Water intake" onBack={() => setView('dashboard')} action={<Pressable onPress={() => Alert.alert('Water goal', `Your daily goal is ${WATER_GOAL * GLASS_ML / 1000} L (${WATER_GOAL} glasses).`)} style={editPill}><Ionicons name="create-outline" size={11} color={navy} /><Text style={editText}>Edit</Text></Pressable>} />
      <View style={{ marginTop: 12, marginBottom: 18 }}><WaterBody current={todayWater} goal={WATER_GOAL * GLASS_ML} /></View>
      <Pressable onPress={() => navigation.navigate('WaterIntake')} style={{ alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12, marginBottom: 8 }}><Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>Manage water intake</Text></Pressable>
      {waterControl()}
      {waterError ? <Text style={{ color: '#B42318', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{waterError}</Text> : null}
      <Pressable disabled={savingWater || !waterDirty} onPress={() => void saveWater().then(ok => { if (ok) Alert.alert('Saved', 'Today\'s water intake was saved to your account.'); })} style={{ alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: 15, backgroundColor: waterDirty ? navy : '#8998B6', marginTop: 12 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{savingWater ? 'Saving…' : waterDirty ? 'Save water intake' : 'All changes saved'}</Text>
      </Pressable>
      <LinearGradient colors={panel} style={{ borderRadius: 22, padding: 16, marginTop: 20, marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View><Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>This week</Text><Text style={{ color: mutedOnPanel, fontSize: 9, marginTop: 3 }}>{weekLabel} · Litres per day</Text></View>
          <View style={{ borderWidth: 1, borderColor: '#ffffff55', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: '#fff', fontSize: 9 }}>7 DAYS</Text></View>
        </View>
        <View style={{ marginTop: 18, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#ffffff44' }} />
        {waterChart()}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 13, gap: 12 }}><Legend color="#45C4EE" label="Goal reached" /><Legend color="#817FE2" label="Below goal" /><Legend color="#F2D486" label="Today" /></View>
        <Text style={{ color: mutedOnPanel, fontSize: 9, marginTop: 8 }}>— — —  Goal {WATER_GOAL * GLASS_ML / 1000} L</Text>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 15 }}>
          <WaterStat label="AVERAGE" value={`${(waterWeek.reduce((sum, day) => sum + day.value, 0) / 7).toFixed(1)} L`} detail="per day" />
          <WaterStat label="BEST DAY" value={`${Math.max(0, ...waterWeek.map(day => day.value)).toFixed(1)} L`} detail={waterWeek.find(day => day.value === Math.max(0, ...waterWeek.map(d => d.value)))?.label ?? '—'} />
          <WaterStat label="GOAL MET" value={`${waterWeek.filter(day => day.value >= WATER_GOAL * GLASS_ML / 1000).length} / 7`} detail="days" />
        </View>
      </LinearGradient>
    </>
  );

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: view === 'dashboard' ? 8 : 5, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {view === 'dashboard' ? renderDashboard() : view === 'steps' ? renderSteps() : renderWater()}
      </ScrollView>
    </Screen>
  );
}

function DetailHeader({ title, onBack, action }: { title: string; onBack: () => void; action?: React.ReactNode }) {
  const { theme } = useTheme();
  return <View style={{ height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Pressable onPress={onBack} style={{ width: 31, height: 31, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.34)' }}><Ionicons name="chevron-back" size={17} color={theme.text} /></Pressable>
    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' }}>{title}</Text>
    <View style={{ minWidth: 38, alignItems: 'flex-end' }}>{action}</View>
  </View>;
}

function StatCard({ icon, value, unit, colors }: { icon: any; value: string; unit: string; colors: readonly [string, string] }) {
  return <LinearGradient colors={colors as [string, string]} style={{ flex: 1, borderRadius: 13, minHeight: 65, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
    <Ionicons name={icon} size={14} color="#F2B6F1" /><Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginTop: 3 }}>{value}</Text><Text style={{ color: '#CBD7F1', fontSize: 8 }}>{unit}</Text>
  </LinearGradient>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} /><Text style={{ color: '#D9E2F7', fontSize: 8 }}>{label}</Text></View>;
}

function WaterStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <View style={{ flex: 1, minHeight: 65, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.19)', backgroundColor: 'rgba(255,255,255,0.035)', padding: 9, justifyContent: 'center' }}>
    <Text style={{ color: '#CBD7F1', fontSize: 7, letterSpacing: 0.8 }}>{label}</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 }}>{value}</Text><Text style={{ color: '#CBD7F1', fontSize: 8, marginTop: 1 }}>{detail}</Text>
  </View>;
}

function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.0', '')}k`;
  return String(value);
}

const dashboardCard = { borderRadius: 20, padding: 14, shadowColor: '#243B80', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 5 } as const;
const editPill = { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.45)' };
const editText = { color: '#153B79', fontSize: 8, marginLeft: 3 } as const;
const syncPill = { alignSelf: 'center' as const, flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: '#ffffff55', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 };
const smallControl = { width: 32, height: 32, borderRadius: 17, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#244E8B', borderWidth: 1, borderColor: '#ffffff25' };
const reminderIcon = { width: 29, height: 29, borderRadius: 9, backgroundColor: 'rgba(229,210,247,0.18)', alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' };
const legendText = { color: '#D9E2F7', fontSize: 8 } as const;
