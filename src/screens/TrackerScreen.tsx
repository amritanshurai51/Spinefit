import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Circle, Svg, SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { useTheme } from '../theme/ThemeContext';
import { registerForNotifications, setReminder } from '../services/notifications';
import { WaterBody } from '../components/WaterBody';
import { WaterMugIcon } from '../components/WaterMugIcon';
import { useWaterIntake } from '../store/useWaterIntake';
import { expandIconXml } from '../assets/expandIconXml';
import { Api } from '../api/endpoints';
import type { ApiError } from '../api/client';
import { getStepCountForDay, isStepSourceAvailable } from '../services/stepSource';

const STEP_GOAL = 8000;
const WATER_SETTINGS_KEY = 'water-intake-settings';

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
  const [stepError, setStepError] = useState<string | null>(null);
  const syncingSteps = useRef(false);
  const { current: todayWater, changeIntake, week: savedWaterWeek, save: saveWater, saveDay: saveWaterDay, saving: savingWater, dirty: waterDirty, error: waterError, reload: reloadWater } = useWaterIntake();
  const [glassSize, setGlassSize] = useState(300);
  const [dailyGoalMl, setDailyGoalMl] = useState(3000);
  const [draftGlassSize, setDraftGlassSize] = useState(300);
  const [draftGoalMl, setDraftGoalMl] = useState(3000);
  const [customizeWater, setCustomizeWater] = useState(false);
  const [editingWaterHistory, setEditingWaterHistory] = useState(false);
  const [historyDraft, setHistoryDraft] = useState<Record<string, number>>({});
  const [savingWaterHistory, setSavingWaterHistory] = useState(false);
  const [stepWeek, setStepWeek] = useState<DayValue[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState<Record<string, boolean>>({ steps: true, water: false, exercise: true });
  const [today, setToday] = useState(() => new Date());
  const todayKey = dateKey(today);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { void reloadWater(); });
    return unsubscribe;
  }, [navigation, reloadWater]);
  useEffect(() => {
    AsyncStorage.getItem(WATER_SETTINGS_KEY).then(raw => {
      if (!raw) return;
      const settings = JSON.parse(raw);
      const savedGlass = [300, 400, 500].includes(settings.glassSize) ? settings.glassSize : 300;
      const savedGoal = Math.max(2000, Math.min(5000, Math.round((Number(settings.dailyGoalMl) || 3000) / 300) * 300));
      setGlassSize(savedGlass);
      setDailyGoalMl(savedGoal);
      setDraftGlassSize(savedGlass);
      setDraftGoalMl(savedGoal);
    }).catch(() => {});
  }, []);
  const glasses = Math.round(todayWater / glassSize);
  const goalGlasses = Math.ceil(dailyGoalMl / glassSize);
  const stepPercent = Math.min(100, Math.round((steps / STEP_GOAL) * 100));
  const waterPercent = Math.min(100, Math.round((todayWater / dailyGoalMl) * 100));
  const weekLabel = `${weekDates(today)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const loadStepWeek = useCallback(async () => {
    try {
      const [todayResult, history] = await Promise.all([Api.steps(todayKey), Api.stepsHistory(todayKey)]);
      setSteps(todayResult.steps);
      const totals = new Map<string, number>(history.days.map(day => [day.day, day.steps] as const));
      const values = weekDates(today).map(date => ({
        date,
        label: dayLabel(date),
        value: dateKey(date) === todayKey ? todayResult.steps : totals.get(dateKey(date)) ?? 0,
      }));
      setStepWeek(values);
      setStepError(null);
    } catch (cause: any) {
      const error = cause as ApiError;
      setStepError(error.detail ?? 'Could not load your steps from the server.');
    }
  }, [today, todayKey]);

  const syncSteps = useCallback(async () => {
    if (syncingSteps.current) return;
    syncingSteps.current = true;
    try {
      if (!(await isStepSourceAvailable())) {
        await loadStepWeek();
        setStepError(Platform.OS === 'ios'
          ? 'Apple Health is not available on this iPhone.'
          : 'Step counting is not available on this device.');
        return;
      }
      const todayDate = new Date();
      const todayString = dateKey(todayDate);
      let syncFailure = '';
      for (let back = 6; back >= 0; back -= 1) {
        const day = new Date(todayDate);
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - back);
        const start = new Date(day);
        const end = new Date(day);
        end.setDate(end.getDate() + 1);
        if (back === 0) end.setTime(Date.now());
        try {
          const total = Math.max(0, Math.min(100000, await getStepCountForDay(start, end)));
          try {
            await Api.saveSteps(dateKey(day), total, todayString);
          } catch (cause: any) {
            if (cause?.code !== 'profile_missing') throw cause;
            await Api.me();
            await Api.saveSteps(dateKey(day), total, todayString);
          }
        } catch (cause: any) {
          const error = cause as ApiError;
          syncFailure = cause?.message ?? error.detail ?? 'Could not sync your step history.';
        }
      }
      await loadStepWeek();
      if (syncFailure) setStepError(syncFailure);
    } catch (cause: any) {
      const error = cause as ApiError;
      setStepError(cause?.message ?? error.detail ?? 'Could not sync steps. Check your connection and try again.');
      await loadStepWeek();
    } finally {
      syncingSteps.current = false;
    }
  }, [loadStepWeek]);

  const waterWeek: DayValue[] = savedWaterWeek.map(({ day, water_ml }) => {
    const [year, month, date] = day.split('-').map(Number);
    const localDay = new Date(year, month - 1, date);
    return { date: localDay, label: dayLabel(localDay), value: water_ml / 1000 };
  }).map(day => dateKey(day.date) === todayKey && waterDirty
    ? { ...day, value: todayWater / 1000 }
    : day);
  const editableWaterDays = [0, 1, 2].map(offset => {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const key = dateKey(date);
    const savedMl = offset === 0 ? todayWater : savedWaterWeek.find(day => day.day === key)?.water_ml ?? 0;
    return { key, title: offset === 0 ? 'Today' : offset === 1 ? 'Yesterday' : dayLabel(date).toUpperCase(), savedMl, savedGlasses: Math.round(savedMl / glassSize) };
  });

  useEffect(() => {
    AsyncStorage.getItem('reminders').then(saved => {
      if (saved) setReminderEnabled({ steps: true, water: false, exercise: true, ...JSON.parse(saved) });
    }).catch(() => {});
    void syncSteps();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        const now = new Date();
        setToday(current => dateKey(current) === dateKey(now) ? current : now);
        void syncSteps();
      }
    });
    return () => subscription.remove();
  }, [syncSteps]);

  const addWater = (amount: number) => {
    changeIntake(amount * glassSize);
  };

  const saveWaterSettings = async () => {
    await AsyncStorage.setItem(WATER_SETTINGS_KEY, JSON.stringify({ glassSize: draftGlassSize, dailyGoalMl: draftGoalMl }));
    setGlassSize(draftGlassSize);
    setDailyGoalMl(draftGoalMl);
    setCustomizeWater(false);
  };

  const beginWaterHistoryEdit = () => {
    setHistoryDraft(Object.fromEntries(editableWaterDays.map(day => [day.key, day.savedGlasses])));
    setEditingWaterHistory(true);
  };

  const saveWaterHistory = async () => {
    setSavingWaterHistory(true);
    try {
      for (const day of editableWaterDays) {
        const count = historyDraft[day.key] ?? day.savedGlasses;
        const value = count * glassSize;
        if (count !== day.savedGlasses) await saveWaterDay(day.key, value);
      }
      await reloadWater();
      setEditingWaterHistory(false);
      Alert.alert('Saved', 'Your water intake history was updated.');
    } catch (error: any) {
      Alert.alert('Could not save', error?.detail ?? error?.message ?? 'Please try again. The server may only allow edits for the last three days.');
    } finally {
      setSavingWaterHistory(false);
    }
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
    <View style={{ height: compact ? 56 : 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 33, paddingHorizontal: 10, backgroundColor: '#0E448F' }}>
      <Pressable onPress={() => addWater(-1)} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#255493', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
        <Ionicons name="remove" size={24} color="#DDE9FF" />
      </Pressable>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{glasses} {glasses === 1 ? 'glass' : 'glasses'}</Text>
        <Text style={{ color: '#C8D6F2', fontSize: 12, marginTop: 2 }}>Tap glass when sip</Text>
      </View>
      <Pressable onPress={() => addWater(1)} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0CA8EE' }}>
        <WaterMugIcon size={22} color="#fff" />
      </Pressable>
    </View>
  );

  const stepChart = (data: DayValue[], compact = false) => {
    const chartHeight = compact ? 116 : 164;
    const maxValue = Math.max(STEP_GOAL, ...data.map(day => day.value), 1);
    return (
      <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 18 }}>
        {data.map((day, index) => {
          const height = Math.max(12, (day.value / maxValue) * (chartHeight - 45));
          const isToday = dateKey(day.date) === todayKey;
          return (
            <View key={dateKey(day.date)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <Text style={{ color: isToday ? '#FFE6A6' : '#C8D5F2', fontSize: 10, marginBottom: 4 }}>{day.value ? formatCompact(day.value) : ''}</Text>
              <View style={{ width: compact ? 20 : 26, height, borderRadius: 7, backgroundColor: isToday ? '#F2D486' : index === 3 ? '#5DC9F2' : '#F2B6F1' }} />
              <Text style={{ color: '#E3E9FB', fontSize: 10, marginTop: 5 }}>{day.label}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const waterChart = () => {
    const chartHeight = 180;
    const maxValue = Math.max(2, ...waterWeek.map(day => day.value));
    return (
      <View style={{ height: chartHeight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 18 }}>
        {waterWeek.map(day => {
          const isToday = dateKey(day.date) === todayKey;
          const height = Math.max(8, (day.value / maxValue) * 104);
          const reached = day.value >= dailyGoalMl / 1000;
          return (
            <View key={dateKey(day.date)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <Text style={{ color: isToday ? '#FFE5A7' : '#D8E1F7', fontSize: 10, marginBottom: 5 }}>{day.value.toFixed(1)}</Text>
              <View style={{ width: 23, height, borderRadius: 7, backgroundColor: isToday ? '#F2D486' : reached ? '#45C4EE' : '#817FE2' }} />
              <Text style={{ color: '#EDF0FA', fontSize: 9, marginTop: 7 }}>{day.label}</Text>
              <Text style={{ color: '#B9C7E9', fontSize: 9 }}>{day.date.getDate()}</Text>
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
        <Pressable onPress={() => setView('steps')}><Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>Steps</Text></Pressable>
        {/* <Pressable onPress={() => setView('steps')} style={editPill}><Ionicons name="create-outline" size={18} color={navy} /><Text style={editText}>Edit</Text></Pressable> */}
      </View>
      <LinearGradient colors={panel} style={dashboardCard}>
        <Pressable onPress={() => setView('steps')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, paddingRight: 25, position: 'relative' }}>
          <SvgXml xml={expandIconXml} width={25} height={25} style={{ position: 'absolute', top: 0, right: 0 }} />
          {progressRing(stepPercent, 110, '#F3D486', <View style={{ alignItems: 'center' }}><Ionicons name="walk" size={25} color="#fff" /><Text style={{ color: '#fff', fontSize: 15.3, fontWeight: '800', marginTop: 1 }}>{stepPercent}%</Text><Text style={{ color: '#D6E0F6', fontSize: 9.69 }}>of goal</Text></View>)}
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={{ color: mutedOnPanel, fontSize: 12.24 }}>Steps today</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginVertical: 1 }}>{steps.toLocaleString()}</Text>
            <Text style={{ color: '#D3DDF2', fontSize: 12.24 }}>{Math.max(0, STEP_GOAL - steps).toLocaleString()} to go</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => void syncSteps()} style={syncPill}><Ionicons name="sync-outline" size={13} color="#fff" /><Text style={{ color: '#fff', fontSize: 11.73, marginLeft: 4 }}>Sync now</Text></Pressable>
      </LinearGradient>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 19, marginBottom: 7 }}>
        <Pressable onPress={() => setView('water')}><Text style={{ color: theme.text, fontSize: 17, fontWeight: '800' }}>Water Intake</Text></Pressable>
        <Pressable disabled={savingWater || !waterDirty} onPress={() => void saveWater().then(ok => { if (ok) Alert.alert('Saved', 'Today\'s water intake was saved to your account.'); })} style={{ minWidth: 62, minHeight: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 16, backgroundColor: savingWater || !waterDirty ? '#A7B2C8' : navy }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{savingWater ? 'Saving…' : 'Save'}</Text></Pressable>
      </View>
      <LinearGradient colors={panel} style={dashboardCard}>
        <Pressable onPress={() => setView('water')} style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 25, position: 'relative' }}>
          {progressRing(waterPercent, 92, '#59D4FB', <View style={{ alignItems: 'center' }}><WaterMugIcon size={20} color="#fff" /><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{glasses}/{goalGlasses}</Text><Text style={{ color: '#D6E0F6', fontSize: 9 }}>glasses</Text></View>)}
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: mutedOnPanel, fontSize: 12.24 }}>Water logged</Text>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', marginVertical: 2 }}>{(todayWater / 1000).toFixed(2)} L</Text>
            <Text style={{ color: '#D3DDF2', fontSize: 12.24 }}>of {(dailyGoalMl / 1000).toFixed(1)} L daily goal</Text>
          </View>
          <SvgXml xml={expandIconXml} width={25} height={25} style={{ position: 'absolute', top: 0, right: 0 }} />
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 12, paddingHorizontal: 1 }}>
          {Array.from({ length: goalGlasses }).map((_, index) => <View key={index} style={{ width: 23, height: 24, borderRadius: 6, backgroundColor: index < glasses ? 'rgba(81,211,250,0.25)' : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: index < glasses ? '#55D3F6' : 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' }}><WaterMugIcon size={13} color={index < glasses ? '#69DCFC' : '#A6B7D9'} /></View>)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => addWater(-1)} style={smallControl}><Ionicons name="remove" size={22} color="#fff" /></Pressable>
          <Pressable onPress={() => setView('water')} style={{ alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{glasses} {glasses === 1 ? 'glass' : 'glasses'}</Text><Text style={{ color: mutedOnPanel, fontSize: 11, marginTop: 2 }}>Tap + to log</Text></Pressable>
          <Pressable onPress={() => addWater(1)} style={[smallControl, { backgroundColor: 'transparent', borderColor: 'transparent', overflow: 'hidden' }]}>
            <LinearGradient colors={['#4ADAFF', '#00AAFF']} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 30 }} />
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <Text style={{ color: theme.text, fontSize: 17, fontWeight: '800', marginTop: 21, marginBottom: 7 }}>Reminders</Text>
      <LinearGradient colors={panel} style={{ borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 }}>
        {REMINDERS.map(reminder => (
          <View key={reminder.key} style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', borderBottomWidth: reminder.key === 'exercise' ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.09)' }}>
            <View style={reminderIcon}>{reminder.key === 'water' ? <WaterMugIcon size={20} color="#F1D0F6" /> : <Ionicons name={reminder.icon as any} size={20} color="#F1D0F6" />}</View>
            <View style={{ flex: 1, marginLeft: 10 }}><Text style={{ color: '#fff', fontSize: 14.28, fontWeight: '500' }}>{reminder.title}</Text><Text style={{ color: mutedOnPanel, fontSize: 12.24, marginTop: 2 }}>{reminder.subtitle}</Text></View>
            <ReminderToggle value={!!reminderEnabled[reminder.key]} onValueChange={enabled => void toggleReminder(reminder.key, enabled)} />
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 7 }}><View style={reminderIcon}><Ionicons name="moon-outline" size={20} color="#F1D0F6" /></View><View style={{ marginLeft: 10 }}><Text style={{ color: '#fff', fontSize: 14.28, fontWeight: '600' }}>Quiet hours</Text><Text style={{ color: mutedOnPanel, fontSize: 12.24, marginTop: 2, marginBottom: 10 }}>No reminders 9 PM – 7 AM</Text></View></View>
      </LinearGradient>
    </>
  );

  const renderSteps = () => (
    <>
      <DetailHeader title="Steps" onBack={() => setView('dashboard')} />
      {stepError ? <Pressable onPress={() => void syncSteps()} style={{ flexDirection: 'row', alignItems: 'center', padding: 11, marginTop: 8, marginHorizontal: 2, marginBottom: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.75)' }}><Ionicons name="alert-circle-outline" size={17} color="#A33C54" /><Text style={{ flex: 1, color: '#762A43', fontSize: 11, marginLeft: 7 }}>{stepError} Tap to retry.</Text></Pressable> : null}
      <View style={{ alignItems: 'center', paddingTop: 22, paddingBottom: 21 }}>
        {progressRing(stepPercent, 140, '#E5B900', <View style={{ alignItems: 'center' }}><Ionicons name="walk" size={25} color={navy} /><Text style={{ color: navy, fontSize: 19.33, fontWeight: '800', marginTop: 2 }}>{stepPercent}%</Text><Text style={{ color: '#62739B', fontSize: 12.24 }}>of goal</Text></View>)}
        <Text style={{ color: '#344F85', fontSize: 32, fontWeight: '700', marginTop: 17 }}>{steps.toLocaleString()}</Text>
        <Text style={{ color: '#536A99', fontSize: 18 }}>{Math.max(0, STEP_GOAL - steps).toLocaleString()} to go</Text>
        <Pressable onPress={() => void syncSteps()} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', paddingVertical: 9, paddingHorizontal: 15, marginTop: 11 }}><Ionicons name="sync-outline" size={14} color={navy} /><Text style={{ color: navy, fontSize: 11.73, marginLeft: 5 }}>Sync now</Text></Pressable>
        <Text style={{ color: theme.subtext, fontSize: 14, marginTop: 12 }}>Last synced at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 2, marginBottom: 21 }}>
        <StatCard icon="walk" value={`${(steps * 0.00071).toFixed(1)}`} unit="km" colors={panel} />
        <StatCard icon="flame" value={`${Math.round(steps * 0.038)}`} unit="kcal" colors={panel} />
        <StatCard icon="stopwatch-outline" value={`${Math.round(steps / 125)}`} unit="Active min" colors={panel} />
      </View>
      <LinearGradient colors={panel} style={{ borderRadius: 21, padding: 18, marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Daily Steps</Text><Text style={{ color: mutedOnPanel, fontSize: 11, marginTop: 3 }}>Average {Math.round(stepWeek.reduce((sum, day) => sum + day.value, 0) / Math.max(1, stepWeek.length)).toLocaleString()} steps a day</Text></View>
          <View style={{ borderWidth: 1, borderColor: '#ffffff55', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' }}><Ionicons name="options-outline" size={15} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, marginLeft: 5 }}>7 Days</Text></View>
        </View>
        <View style={{ marginTop: 10, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#ffffff44' }} />
        {stepChart(stepWeek)}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}><Text style={legendText}><Text style={{ color: '#F2B6F1' }}>■</Text> Goal progress</Text><Text style={legendText}><Text style={{ color: '#F2D486' }}>■</Text> Today</Text><Text style={legendText}>Goal 8,000</Text></View>
      </LinearGradient>
    </>
  );

  const renderWater = () => (
    <>
      <DetailHeader title="Water intake" onBack={() => setView('dashboard')} action={<Pressable disabled={savingWater || !waterDirty} onPress={() => void saveWater().then(ok => { if (ok) Alert.alert('Saved', 'Today\'s water intake was saved to your account.'); })} style={{ minWidth: 62, minHeight: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 16, backgroundColor: savingWater || !waterDirty ? '#A7B2C8' : navy }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{savingWater ? 'Saving…' : 'Save'}</Text></Pressable>} />
      <View style={{ marginTop: 18, marginBottom: 22 }}>
        <WaterBody current={todayWater} goal={dailyGoalMl} />
      </View>
      <Pressable onPress={() => navigation.navigate('WaterIntake')} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, marginBottom: 10 }}><Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>Manage water intake</Text></Pressable>
      {waterControl()}
      {waterError ? <Text style={{ color: '#B42318', fontSize: 12, marginTop: 12, textAlign: 'center' }}>{waterError}</Text> : null}
      <Pressable onPress={() => { setDraftGlassSize(glassSize); setDraftGoalMl(dailyGoalMl); setCustomizeWater(value => !value); }} style={{ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 3, marginBottom: 11 }}>
        <Text style={{ color: theme.dark ? '#F4B7F2' : '#242076', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }}>Customise Your Glass</Text>
      </Pressable>
      {customizeWater ? <LinearGradient colors={panel} style={{ borderRadius: 23, padding: 17, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Glass size</Text>
        <Text style={{ color: mutedOnPanel, fontSize: 12, marginTop: 4, marginBottom: 12 }}>Choose how much you sip per glass</Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {[300, 400, 500].map(size => <Pressable key={size} onPress={() => setDraftGlassSize(size)} style={{ flex: 1, height: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: draftGlassSize === size ? '#F4B4EE' : 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: draftGlassSize === size ? '#F4B4EE' : 'rgba(255,255,255,0.26)' }}><WaterMugIcon size={19} color={draftGlassSize === size ? '#123B82' : '#66D5FA'} /><Text style={{ color: draftGlassSize === size ? '#162657' : '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 }}>{size} ml</Text></Pressable>)}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
          <View><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Daily goal</Text><Text style={{ color: mutedOnPanel, fontSize: 11, marginTop: 2 }}>Adjust in 300 ml steps · 2–5 L</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Pressable disabled={draftGoalMl <= 2000} onPress={() => setDraftGoalMl(value => Math.max(2000, value - 300))} style={goalAdjust}><Ionicons name="remove" size={19} color="#fff" /></Pressable>
            <Text style={{ color: '#F3B8F1', fontSize: 21, fontWeight: '800', minWidth: 48, textAlign: 'center' }}>{(draftGoalMl / 1000).toFixed(1)} L</Text>
            <Pressable disabled={draftGoalMl >= 5000} onPress={() => setDraftGoalMl(value => Math.min(5000, value + 300))} style={goalAdjust}><Ionicons name="add" size={19} color="#fff" /></Pressable>
          </View>
        </View>
        <Text style={{ color: mutedOnPanel, fontSize: 11, marginTop: 5 }}>About {Math.ceil(draftGoalMl / draftGlassSize)} glasses per day</Text>
        <Pressable disabled={draftGlassSize === glassSize && draftGoalMl === dailyGoalMl} onPress={() => void saveWaterSettings()} style={{ height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 13, backgroundColor: draftGlassSize === glassSize && draftGoalMl === dailyGoalMl ? '#B58BBF' : '#F2B6F1' }}><Text style={{ color: '#182454', fontSize: 13, fontWeight: '800' }}>Save Changes</Text></Pressable>
      </LinearGradient> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 9 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Water Analysis</Text>
        <Pressable onPress={() => editingWaterHistory ? setEditingWaterHistory(false) : beginWaterHistoryEdit()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 17, backgroundColor: navy }}><Ionicons name={editingWaterHistory ? 'close' : 'create-outline'} size={13} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{editingWaterHistory ? 'Cancel' : 'Edit'}</Text></Pressable>
      </View>
      {editingWaterHistory ? <LinearGradient colors={panel} style={{ borderRadius: 21, padding: 17, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
        {editableWaterDays.map(day => {
          const count = historyDraft[day.key] ?? day.savedGlasses;
          const slots = Math.max(8, Math.min(18, Math.ceil(dailyGoalMl / glassSize) + 2));
          return <View key={day.key} style={{ marginBottom: 14 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 }}>{day.title}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {Array.from({ length: slots }, (_, index) => <Pressable key={index} onPress={() => setHistoryDraft(current => ({ ...current, [day.key]: index < count ? index : index + 1 }))} style={{ width: 34, height: 37, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: index < count ? 'rgba(80,205,248,0.35)' : 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: index < count ? '#63D2F6' : 'rgba(255,255,255,0.15)' }}><WaterMugIcon size={17} color={index < count ? '#67D7FB' : '#9DADD0'} /></Pressable>)}
            </View>
            <Text style={{ color: mutedOnPanel, fontSize: 11, marginTop: 6 }}>{count} glasses · {((count * glassSize) / 1000).toFixed(1)} L</Text>
          </View>;
        })}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          <Pressable onPress={beginWaterHistoryEdit} style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7894C7' }}><Text style={{ color: '#15346F', fontSize: 12, fontWeight: '800' }}>Redo Water Intake</Text></Pressable>
          <Pressable disabled={savingWaterHistory} onPress={() => void saveWaterHistory()} style={{ flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: savingWaterHistory ? '#B58BBF' : '#F2B6F1' }}><Text style={{ color: '#182454', fontSize: 12, fontWeight: '800' }}>{savingWaterHistory ? 'Saving…' : 'Save Changes'}</Text></Pressable>
        </View>
      </LinearGradient> : null}
      <LinearGradient colors={panel} style={{ borderRadius: 22, padding: 18, marginTop: 20, marginBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View><Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>This week</Text><Text style={{ color: mutedOnPanel, fontSize: 9, marginTop: 3 }}>{weekLabel} · Litres per day</Text></View>
          <View style={{ borderWidth: 1, borderColor: '#ffffff55', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ color: '#fff', fontSize: 9 }}>7 DAYS</Text></View>
        </View>
        <View style={{ marginTop: 18, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#ffffff44' }} />
        {waterChart()}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 13, gap: 12 }}><Legend color="#45C4EE" label="Goal reached" /><Legend color="#817FE2" label="Below goal" /><Legend color="#F2D486" label="Today" /></View>
        <Text style={{ color: mutedOnPanel, fontSize: 9, marginTop: 8 }}>— — —  Goal {(dailyGoalMl / 1000).toFixed(1)} L</Text>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 15 }}>
          <WaterStat label="AVERAGE" value={`${(waterWeek.reduce((sum, day) => sum + day.value, 0) / 7).toFixed(1)} L`} detail="per day" />
          <WaterStat label="BEST DAY" value={`${Math.max(0, ...waterWeek.map(day => day.value)).toFixed(1)} L`} detail={waterWeek.find(day => day.value === Math.max(0, ...waterWeek.map(d => d.value)))?.label ?? '—'} />
          <WaterStat label="GOAL MET" value={`${waterWeek.filter(day => day.value >= dailyGoalMl / 1000).length} / 7`} detail="days" />
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
  return <View style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Pressable onPress={onBack} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 2 }}><Ionicons name="chevron-back" size={21} color={theme.text} /></Pressable>
    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>{title}</Text>
    <View style={{ minWidth: 38, alignItems: 'flex-end' }}>{action}</View>
  </View>;
}

function StatCard({ icon, value, unit, colors }: { icon: any; value: string; unit: string; colors: readonly [string, string] }) {
  return <LinearGradient colors={colors as [string, string]} style={{ flex: 1, borderRadius: 13, minHeight: 65, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
    <Ionicons name={icon} size={17} color="#F2B6F1" /><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 3 }}>{value}</Text><Text style={{ color: '#CBD7F1', fontSize: 10 }}>{unit}</Text>
  </LinearGradient>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color }} /><Text style={{ color: '#D9E2F7', fontSize: 10 }}>{label}</Text></View>;
}

function WaterStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <View style={{ flex: 1, minHeight: 65, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.19)', backgroundColor: 'rgba(255,255,255,0.035)', padding: 9, justifyContent: 'center' }}>
    <Text style={{ color: '#CBD7F1', fontSize: 10, letterSpacing: 0.8 }}>{label}</Text><Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 4 }}>{value}</Text><Text style={{ color: '#CBD7F1', fontSize: 12, marginTop: 2 }}>{detail}</Text>
  </View>;
}

function ReminderToggle({ value, onValueChange }: { value: boolean; onValueChange: (enabled: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Reminder setting"
      onPress={() => onValueChange(!value)}
      style={{ width: 44.89, height: 26.53, borderRadius: 101, borderWidth: 1, borderColor: 'transparent', padding: 2.04, alignItems: value ? 'flex-end' : 'flex-start', justifyContent: 'center', backgroundColor: value ? 'transparent' : '#53658A' }}
    >
      {value ? <LinearGradient colors={['#FCD7FF', '#F79CFF']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 101 }} /> : null}
      <View style={{ width: 20.4, height: 20.4, borderRadius: 10.2, backgroundColor: '#FFFFFF', shadowColor: '#000000', shadowOffset: { width: 0, height: 2.04 }, shadowOpacity: 0.35, shadowRadius: 5.1, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }} />
    </Pressable>
  );
}

function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.0', '')}k`;
  return String(value);
}

const dashboardCard = { borderRadius: 20, padding: 20, shadowColor: '#243B80', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 5 } as const;
const editPill = { flexDirection: 'row' as const, alignItems: 'center' as const, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.45)' };
const editText = { color: '#153B79', fontSize: 11, marginLeft: 3 } as const;
const syncPill = { alignSelf: 'center' as const, flexDirection: 'row' as const, alignItems: 'center' as const, borderWidth: 1, borderColor: '#ffffff55', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, marginTop: 8 };
const smallControl = { width: 48, height: 48, borderRadius: 30, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#244E8B', borderWidth: 1, borderColor: '#ffffff25' };
const goalAdjust = { width: 38, height: 38, borderRadius: 19, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#214F9A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' } as const;
const reminderIcon = { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(229,210,247,0.18)', alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' };
const legendText = { color: '#D9E2F7', fontSize: 10 } as const;
