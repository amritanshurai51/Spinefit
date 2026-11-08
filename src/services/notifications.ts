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

/** Request permission for on-device reminders. This also works in Expo Go. */
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  return status === 'granted';
}

type Rem = { title: string; body: string; startHour: number; endHour: number; everyMin: number };
export const REMINDERS: Record<string, Rem> = {
  steps: { title: 'Step goal check-in', body: 'How are your steps today? Take a short walk!', startHour: 9, endHour: 18, everyMin: 120 },
  water: { title: `Time to hydrate \u{1F4A7}`, body: 'Drink a glass of water.', startHour: 7, endHour: 21, everyMin: 90 },
  exercise: { title: 'Exercise time', body: 'A 10-minute posture session is waiting for you.', startHour: 18, endHour: 18, everyMin: 1440 },
};

// Quiet hours (9PM-7AM) are respected by only scheduling inside the allowed window.
export async function setReminder(key: string, enabled: boolean, at?: { hour: number; minute: number }) {
  const Notifications = await getNotifications();
  const reminder = REMINDERS[key];
  if (!reminder) return;

  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all
    .filter(notification => notification.content.data?.key === key)
    .map(notification => Notifications.cancelScheduledNotificationAsync(notification.identifier)));

  if (!enabled) return;
  if (!(await requestNotificationPermission())) {
    throw new Error('Notification permission is off. Allow notifications in your phone settings to receive reminders.');
  }

  const times = at ? [at] : Array.from(
    { length: Math.floor(((reminder.endHour - reminder.startHour) * 60) / reminder.everyMin) + 1 },
    (_, index) => {
      const minuteOfDay = reminder.startHour * 60 + index * reminder.everyMin;
      return { hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60 };
    },
  );
  for (const time of times) {
    await Notifications.scheduleNotificationAsync({
      content: { title: reminder.title, body: reminder.body, data: { key } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: time.hour, minute: time.minute },
    });
  }
}
