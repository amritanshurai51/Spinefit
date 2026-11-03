import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export type DaySteps = { day: string; steps: number };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function useAndroidSteps(days = 7) {
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState<DaySteps[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const sync = useCallback(async (): Promise<DaySteps[]> => {
    if (Platform.OS !== 'android') return [];
    setLoading(true);
    setError(null);
    try {
      const HC = require('react-native-health-connect');
      const status = await HC.getSdkStatus();
      if (status !== HC.SdkAvailabilityStatus.SDK_AVAILABLE)
        throw new Error('Health Connect is not installed or not available on this phone.');
      await HC.initialize();
      const granted = await HC.requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
      if (!granted?.length) throw new Error('Permission to read steps was not given.');

      const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
      const res = await HC.aggregateGroupByDuration({
        recordType: 'Steps',
        timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: new Date().toISOString() },
        timeRangeSlicer: { duration: 'DAYS', length: 1 },
      });
      const totals = new Map<string, number>(res.map((r: any) => [
        ymd(new Date(r.startTime)),
        Math.max(0, Math.round(r.result?.COUNT_TOTAL ?? 0)),
      ] as const));
      const list: DaySteps[] = Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (days - 1 - index));
        const day = ymd(date);
        return { day, steps: totals.get(day) ?? 0 };
      });
      setWeek(list);
      setToday(list.length ? list[list.length - 1].steps : 0);
      const syncedAt = new Date();
      setLastSynced(syncedAt);
      return list;
    } catch (e: any) {
      const message = e?.message ?? 'Could not read steps';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  return { today, week, error, loading, lastSynced, sync };
}
