import * as Device from 'expo-device';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');
let notificationsModule: NotificationsModule | undefined;

async function getNotifications(): Promise<NotificationsModule> {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
  }
  return notificationsModule;
}

export async function registerForNotifications(): Promise<string | null> {
  // Expo Go on Android cannot load the remote push-token listener in this SDK.
  // Leave notification APIs unloaded so the rest of the app can start.
  if (isRunningInExpoGo()) return null;
  const Notifications = await getNotifications();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH });
  }
  if (!Device.isDevice) return null;
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  // Send this token to the backend so the team can push remote notifications.
  return (await Notifications.getExpoPushTokenAsync()).data;
}

type Rem = { title: string; body: string; startHour: number; endHour: number; everyMin: number };
export const REMINDERS: Record<string, Rem> = {
  steps: { title: 'Step goal check-in', body: 'How are your steps today? Take a short walk!', startHour: 9, endHour: 18, everyMin: 120 },
  water: { title: 'Time to hydrate 💧', body: 'Drink a glass of water.', startHour: 7, endHour: 21, everyMin: 90 },
  exercise: { title: 'Exercise time', body: 'A 10-minute posture session is waiting for you.', startHour: 18, endHour: 18, everyMin: 1440 },
};

// Quiet hours (9PM-7AM) are respected by only scheduling inside the allowed window.
export async function setReminder(key: string, enabled: boolean, at?: { hour: number; minute: number }) {
  if (isRunningInExpoGo()) return;
  const Notifications = await getNotifications();
  const r = REMINDERS[key];
  if (!r) return;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter(n => n.content.data?.key === key).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!enabled) return;
  const times = at ? [at] : Array.from(
    { length: Math.floor(((r.endHour - r.startHour) * 60) / r.everyMin) + 1 },
    (_, index) => {
      const minuteOfDay = r.startHour * 60 + index * r.everyMin;
      return { hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60 };
    },
  );
  for (const time of times) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, data: { key } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: time.hour, minute: time.minute },
    });
  }
}
