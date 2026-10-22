import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../api/client';
import { Api, localDateString, WaterDay } from '../api/endpoints';

export const WATER_GLASS_ML = 250;
export const WATER_GOAL_LITRES = 3;
export const WATER_GOAL_ML = WATER_GOAL_LITRES * 1000;
export const WATER_MAX_ML = 10_000;

const cacheKey = (day: string) => `water-ml:${day}`;
const pendingKey = (day: string) => `water-pending:${day}`;

export function useWaterIntake() {
  const [dateKey, setDateKey] = useState(() => localDateString());
  const [current, setCurrent] = useState(0);
  const [history, setHistory] = useState<WaterDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);
  const storageKey = useMemo(() => cacheKey(dateKey), [dateKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cached, oldCache, pending] = await Promise.all([
        AsyncStorage.getItem(cacheKey(dateKey)),
        AsyncStorage.getItem(`water:${dateKey}`),
        AsyncStorage.getItem(pendingKey(dateKey)),
      ]);
      // Older app versions stored a count of 250 ml glasses in water:YYYY-MM-DD.
      const fallbackMl = cached !== null ? Number(cached) : Number(oldCache ?? 0) * WATER_GLASS_ML;
      dirty.current = pending === '1';
      setCurrent(Math.max(0, Math.min(WATER_MAX_ML, fallbackMl || 0)));

      // The API's `today` value must be recalculated in local time for each request.
      const result = await Api.waterHistory();
      setHistory(result.days);
      await Promise.all(result.days.map(day => AsyncStorage.setItem(cacheKey(day.day), String(day.water_ml))));
      if (!dirty.current) {
        const today = result.days.find(day => day.day === dateKey);
        setCurrent(today?.water_ml ?? 0);
      }
    } catch (cause: any) {
      const message = cause instanceof ApiError ? cause.detail : 'Could not load water history. Your saved device data is still available.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    dirty.current = false;
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextDate = localDateString();
      setDateKey(currentDate => currentDate === nextDate ? currentDate : nextDate);
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const changeIntake = useCallback((deltaMl: number) => {
    dirty.current = true;
    setCurrent(value => {
      const next = Math.max(0, Math.min(WATER_MAX_ML, value + Math.round(deltaMl / WATER_GLASS_ML) * WATER_GLASS_ML));
      void AsyncStorage.setItem(storageKey, String(next)).catch(() => {});
      void AsyncStorage.setItem(pendingKey(dateKey), '1').catch(() => {});
      return next;
    });
  }, [dateKey, storageKey]);

  const reset = useCallback(() => {
    dirty.current = true;
    setCurrent(0);
    void AsyncStorage.setItem(storageKey, '0').catch(() => {});
    void AsyncStorage.setItem(pendingKey(dateKey), '1').catch(() => {});
  }, [dateKey, storageKey]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      let result: Awaited<ReturnType<typeof Api.saveWater>>;
      try {
        result = await Api.saveWater(dateKey, current);
      } catch (cause: any) {
        if (cause?.code !== 'profile_missing') throw cause;
        await Api.me();
        result = await Api.saveWater(dateKey, current);
      }
      dirty.current = false;
      await AsyncStorage.removeItem(pendingKey(result.day));
      setCurrent(result.water_ml);
      setHistory(days => {
        const next = days.some(day => day.day === result.day)
          ? days.map(day => day.day === result.day ? { day: result.day, water_ml: result.water_ml } : day)
          : [...days, { day: result.day, water_ml: result.water_ml }].sort((a, b) => a.day.localeCompare(b.day));
        return next;
      });
      await AsyncStorage.setItem(cacheKey(result.day), String(result.water_ml));
      return true;
    } catch (cause: any) {
      const message = cause instanceof ApiError ? cause.detail : cause?.detail ?? 'Could not save water intake. Check your connection and try again.';
      setError(message);
      // The allowed edit window is local today and the previous two days.
      if (cause?.code === 'day_not_editable') void load();
      return false;
    } finally {
      setSaving(false);
    }
  }, [current, dateKey, load]);

  const week = useMemo(() => {
    const byDate = new Map(history.map(day => [day.day, day.water_ml]));
    return Array.from({ length: 7 }, (_, index) => {
      const dayDate = new Date();
      dayDate.setHours(0, 0, 0, 0);
      dayDate.setDate(dayDate.getDate() - 6 + index);
      const day = localDateString(dayDate);
      return { day, water_ml: byDate.get(day) ?? 0 };
    });
  }, [history]);

  return {
    current,
    goal: WATER_GOAL_ML,
    glasses: Math.floor(current / WATER_GLASS_ML),
    history,
    week,
    loading,
    saving,
    error,
    dirty: current !== (history.find(day => day.day === dateKey)?.water_ml ?? 0),
    changeIntake,
    reset,
    save,
    reload: load,
  };
}
