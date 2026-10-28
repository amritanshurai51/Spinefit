import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

const STEP_COUNT_TYPE = 'HKQuantityTypeIdentifierStepCount' as const;

let healthKitAuthorization: Promise<boolean> | null = null;

export async function isStepSourceAvailable(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const healthKit = await import('@kingstinct/react-native-healthkit');
    return healthKit.isHealthDataAvailableAsync();
  }

  return Pedometer.isAvailableAsync();
}

async function requestHealthKitReadAccess() {
  if (!healthKitAuthorization) {
    healthKitAuthorization = import('@kingstinct/react-native-healthkit')
      .then(healthKit => healthKit.requestAuthorization({ toRead: [STEP_COUNT_TYPE] }))
      .catch(error => {
        healthKitAuthorization = null;
        throw error;
      });
  }

  await healthKitAuthorization;
}

/** Reads one local calendar day's total. iOS totals include steps synced from Apple Watch into Health. */
export async function getStepCountForDay(start: Date, end: Date): Promise<number> {
  if (Platform.OS === 'ios') {
    const healthKit = await import('@kingstinct/react-native-healthkit');
    if (!(await healthKit.isHealthDataAvailableAsync())) {
      throw new Error('Apple Health is not available on this iPhone.');
    }

    await requestHealthKitReadAccess();
    const result = await healthKit.queryStatisticsForQuantity(
      STEP_COUNT_TYPE,
      ['cumulativeSum'],
      { filter: { date: { startDate: start, endDate: end } }, unit: 'count' },
    );
    return Math.max(0, Math.round(result.sumQuantity?.quantity ?? 0));
  }

  const result = await Pedometer.getStepCountAsync(start, end);
  return Math.max(0, Math.round(result.steps));
}
