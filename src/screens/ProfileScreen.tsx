import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import { Text, TextInput } from '../components/Typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { setReminder } from '../services/notifications';
import { friendlyAuthError } from '../api/firebase';

type ProfileSettings = {
  notifications: boolean;
  emailUpdates: boolean;
  exerciseReminder: boolean;
  reminderTime: string;
};

const SETTINGS_KEY = 'profileSettings';
const DEFAULT_SETTINGS: ProfileSettings = {
  notifications: true,
  emailUpdates: false,
  exerciseReminder: true,
  reminderTime: '8:00 AM',
};
const REMINDER_TIMES = ['8:00 AM', '12:00 PM', '6:00 PM'];
const NAVY = '#0C3478';
const NAVY_LIGHT = '#193C79';
const WHITE = '#FFFFFF';
const PALE = '#C7D8F6';
const PINK = '#F2A2F1';

function IconBox({ name }: { name: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFFFFF20', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={18} color={WHITE} />
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { theme, setMode } = useTheme();
  const { profile, user, logout, updateName, deleteAccount } = useAuth();
  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    }).catch(() => {});
  }, []);

  useEffect(() => { setNameDraft(profile?.name ?? ''); }, [profile?.name]);

  const saveSettings = (next: ProfileSettings) => {
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  };

  const scheduleExerciseReminder = (enabled: boolean, time = settings.reminderTime, notificationsEnabled = settings.notifications) => {
    if (!notificationsEnabled) return;
    const [clock, period] = time.split(' ');
    const [hourText, minuteText] = clock.split(':');
    let hour = Number(hourText) % 12;
    if (period === 'PM') hour += 12;
    setReminder('exercise', enabled, { hour, minute: Number(minuteText) }).catch(error => {
      console.warn('Could not update the exercise reminder:', error);
    });
  };

  const toggleSetting = (key: 'notifications' | 'emailUpdates' | 'exerciseReminder', value: boolean) => {
    const next = { ...settings, [key]: value };
    saveSettings(next);
    if (key === 'notifications') {
      if (!value) setReminder('exercise', false).catch(() => {});
      else if (settings.exerciseReminder) scheduleExerciseReminder(true, settings.reminderTime, true);
    }
    if (key === 'exerciseReminder') scheduleExerciseReminder(value);
  };

  const chooseReminderTime = (time: string) => {
    const next = { ...settings, reminderTime: time };
    saveSettings(next);
    setTimePickerVisible(false);
    if (settings.exerciseReminder) scheduleExerciseReminder(true, time);
  };

  const name = profile?.name?.trim() || 'Member';
  const email = profile?.email ?? user?.email ?? '';
  const initials = name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase();
  const completedFields = [profile?.name, email].filter(Boolean).length;
  const completion = Math.round((completedFields / 2) * 100);

  const row = (icon: React.ComponentProps<typeof Ionicons>['name'], title: string, subtitle: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 }}>
      <IconBox name={icon} />
      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text style={{ color: WHITE, fontSize: 13, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: PALE, fontSize: 11, marginTop: 3 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#B7C9E7" />
    </Pressable>
  );

  const settingRow = (icon: React.ComponentProps<typeof Ionicons>['name'], title: string, subtitle: string, value: boolean, onChange: (value: boolean) => void) => (
    <View style={{ minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 }}>
      <IconBox name={icon} />
      <View style={{ flex: 1, marginLeft: 11 }}>
        <Text style={{ color: WHITE, fontSize: 13, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: PALE, fontSize: 11, marginTop: 3 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#536A91', true: PINK }}
        thumbColor={WHITE}
        ios_backgroundColor="#536A91"
        style={{ transform: [{ scale: 0.86 }] }}
      />
    </View>
  );

  const sectionTitle = (title: string) => (
    <Text style={{ color: theme.dark ? WHITE : '#211C36', fontSize: 14, fontWeight: '800', marginTop: 18, marginBottom: 8 }}>{title}</Text>
  );
  const unavailable = (feature: string) => Alert.alert(feature, `${feature} will be available when your SpineFit account services are connected.`);

  const saveProfileName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed.length > 255) {
      setNameError('Name must be between 1 and 255 characters.');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      await updateName(trimmed);
      setEditNameVisible(false);
    } catch (error: any) {
      setNameError(error?.detail ?? 'Could not update your name.');
    } finally {
      setSavingName(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Enter your password to continue.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      setDeleteModalVisible(false);
      setDeletePassword('');
    } catch (error: any) {
      setDeleteError(friendlyAuthError(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <Pressable onPress={() => navigation.navigate('Home')} hitSlop={10} style={{ position: 'absolute', left: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF35', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>Profile</Text>
        </View>

        <View style={{ backgroundColor: NAVY, borderRadius: 23, padding: 14, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#D8C9FF', backgroundColor: '#182C71', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: WHITE, fontWeight: '700', fontSize: 13 }}>{initials || 'M'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 11, alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ color: WHITE, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 3 }}>
                <Ionicons name="ribbon" size={15} color="#FFD66B" />
                <Text style={{ color: '#FFD66B', fontSize: 12, marginLeft: 4 }}>Premium member</Text>
              </View>
            </View>
            {/* Restore this switch when dark mode is ready to be enabled:
            <Switch
              value={theme.dark}
              onValueChange={value => setMode(value ? 'dark' : 'light')}
              trackColor={{ false: PINK, true: '#7786B0' }}
              thumbColor={theme.dark ? '#E8ECFA' : '#FFD66B'}
              ios_backgroundColor={PINK}
              style={{ transform: [{ scale: 0.82 }] }}
            />
            */}
          </View>

          <View style={{ marginTop: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconBox name="mail" />
              <Text numberOfLines={1} style={{ color: WHITE, fontSize: 13, flex: 1, marginLeft: 10 }}>{email || 'Email not added'}</Text>
              {email ? <Ionicons name="checkmark-circle" size={15} color="#50D69B" /> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconBox name="person" />
              <Text style={{ color: WHITE, fontSize: 13, flex: 1, marginLeft: 10 }}>SpineFit wellness account</Text>
              <Ionicons name="checkmark-circle" size={15} color="#50D69B" />
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#FFFFFF35', marginTop: 13, marginBottom: 10 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: PALE, fontSize: 12 }}>Profile completed</Text>
                <Text style={{ color: WHITE, fontSize: 12, fontWeight: '700' }}>{completion}%</Text>
              </View>
              <View style={{ height: 4, borderRadius: 4, backgroundColor: '#FFFFFF40' }}>
                <View style={{ height: 4, width: `${completion}%`, borderRadius: 4, backgroundColor: PINK }} />
              </View>
            </View>
            <Pressable onPress={() => { setNameError(''); setEditNameVisible(true); }} style={{ marginLeft: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: PINK }}>
              <Text style={{ color: NAVY, fontSize: 12, fontWeight: '800' }}>Edit profile</Text>
            </Pressable>
          </View>
        </View>

        {sectionTitle('Account')}
        <View style={{ backgroundColor: NAVY_LIGHT, borderRadius: 17, paddingVertical: 2 }}>
          {row('lock-closed-outline', 'Change password', 'Update your account password', () => unavailable('Change password'))}
          <View style={{ height: 1, backgroundColor: '#FFFFFF18', marginHorizontal: 12 }} />
          {row('call-outline', 'Contact the clinic', 'Call, WhatsApp or email us', () => unavailable('Contact the clinic'))}
          <View style={{ height: 1, backgroundColor: '#FFFFFF18', marginHorizontal: 12 }} />
          {row('card-outline', 'Subscription', 'Check your plan and renewal', () => unavailable('Subscription'))}
        </View>

        {sectionTitle('Notifications')}
        <View style={{ backgroundColor: NAVY_LIGHT, borderRadius: 17, paddingVertical: 2 }}>
          {settingRow('notifications-outline', 'Notifications', 'Reminders and updates on this device', settings.notifications, value => toggleSetting('notifications', value))}
          <View style={{ height: 1, backgroundColor: '#FFFFFF18', marginHorizontal: 12 }} />
          {settingRow('mail-outline', 'Email updates', 'Plan, billing and clinic news', settings.emailUpdates, value => toggleSetting('emailUpdates', value))}
          <View style={{ height: 1, backgroundColor: '#FFFFFF18', marginHorizontal: 12 }} />
          {settingRow('time-outline', 'Daily exercise reminder', 'A nudge to do your routine', settings.exerciseReminder, value => toggleSetting('exerciseReminder', value))}
          <View style={{ height: 1, backgroundColor: '#FFFFFF18', marginHorizontal: 12 }} />
          <Pressable onPress={() => setTimePickerVisible(true)} style={{ minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11 }}>
            <IconBox name="calendar-outline" />
            <View style={{ flex: 1, marginLeft: 11 }}>
              <Text style={{ color: WHITE, fontSize: 13, fontWeight: '600' }}>Reminder time</Text>
              <Text style={{ color: PALE, fontSize: 11, marginTop: 3 }}>When we’ll notify you each day</Text>
            </View>
            <View style={{ backgroundColor: '#FFFFFF20', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={12} color="#E8D9FF" />
              <Text style={{ color: WHITE, fontSize: 10, marginLeft: 5 }}>{settings.reminderTime}</Text>
            </View>
          </Pressable>
        </View>

        {sectionTitle('Legal')}
        <View style={{ backgroundColor: NAVY_LIGHT, borderRadius: 17, paddingVertical: 2 }}>
          {row('shield-checkmark-outline', 'Privacy policy', 'How SpineFit protects your data', () => unavailable('Privacy policy'))}
          <View style={{ height: 1, backgroundColor: '#FFFFFF18', marginHorizontal: 12 }} />
          {row('document-text-outline', 'Terms of service', 'Review your terms', () => unavailable('Terms of service'))}
        </View>

        <Pressable onPress={() => { setDeleteError(''); setDeletePassword(''); setDeleteModalVisible(true); }} style={{ alignSelf: 'center', paddingVertical: 14 }}>
          <Text style={{ color: '#FFB7C3', fontSize: 12, fontWeight: '700' }}>Delete my account</Text>
        </Pressable>

        <Pressable onPress={logout} style={{ minHeight: 52, marginTop: 16, borderRadius: 17, backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, elevation: 4 }}>
          <Ionicons name="log-out-outline" size={17} color={PINK} />
          <Text style={{ color: PINK, fontWeight: '800', fontSize: 14 }}>Log out</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={timePickerVisible} transparent animationType="fade" onRequestClose={() => setTimePickerVisible(false)}>
        <Pressable onPress={() => setTimePickerVisible(false)} style={{ flex: 1, backgroundColor: '#080D24A8', justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: theme.dark ? '#19275A' : WHITE, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Reminder time</Text>
            <Text style={{ color: theme.subtext, fontSize: 13, marginBottom: 12 }}>Choose when to get your daily nudge.</Text>
            {REMINDER_TIMES.map(time => (
              <Pressable key={time} onPress={() => chooseReminderTime(time)} style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.border + '30' }}>
                <Text style={{ color: theme.text, fontSize: 14 }}>{time}</Text>
                {settings.reminderTime === time ? <Ionicons name="checkmark-circle" size={20} color={PINK} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editNameVisible} transparent animationType="fade" onRequestClose={() => setEditNameVisible(false)}>
        <Pressable onPress={() => setEditNameVisible(false)} style={{ flex: 1, backgroundColor: '#080D24A8', justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: theme.dark ? '#19275A' : WHITE, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Edit name</Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="Your name" placeholderTextColor={theme.subtext} maxLength={255}
              style={{ color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 46, marginTop: 8 }} />
            {!!nameError && <Text style={{ color: '#D9485F', fontSize: 12, marginTop: 8 }}>{nameError}</Text>}
            <Pressable onPress={saveProfileName} disabled={savingName} style={{ minHeight: 46, marginTop: 14, borderRadius: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: WHITE, fontWeight: '700' }}>{savingName ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <Pressable onPress={() => setDeleteModalVisible(false)} style={{ flex: 1, backgroundColor: '#080D24A8', justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: theme.dark ? '#19275A' : WHITE, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Delete my account?</Text>
            <Text style={{ color: theme.subtext, fontSize: 13, marginBottom: 12 }}>This permanently deletes your account. Enter your password to confirm.</Text>
            <TextInput value={deletePassword} onChangeText={setDeletePassword} placeholder="Password" placeholderTextColor={theme.subtext} secureTextEntry
              style={{ color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, minHeight: 46, marginTop: 8 }} />
            {!!deleteError && <Text style={{ color: '#D9485F', fontSize: 12, marginTop: 8 }}>{deleteError}</Text>}
            <Pressable onPress={confirmDeleteAccount} disabled={deleting} style={{ minHeight: 46, marginTop: 14, borderRadius: 12, backgroundColor: '#C53E59', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: WHITE, fontWeight: '700' }}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
