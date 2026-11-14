import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { HomeVideo } from '../api/endpoints';
import { useContent } from '../store/ContentContext';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../theme/ThemeContext';

type WorkoutDay = { day: number; title: string; videos: HomeVideo[]; rest?: false };
type RestDay = { day: number; title: string; videos: []; rest: true };
type PlanDay = WorkoutDay | RestDay;

const ACTIVE_DAY_CONFIG = [
  { day: 1, capacity: 3 },
  { day: 2, capacity: 3 },
  { day: 4, capacity: 3 },
  { day: 5, capacity: 2 },
  { day: 6, capacity: 3 },
];
const REST_DAYS = new Set([3, 7]);
const dayName = (day: number) => `Day ${day}`;
const mondayKey = (date = new Date()) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
};
const progressKey = (uid: string, week: string) => `foundation-plan-progress:${uid}:${week}`;

function buildPlan(videos: HomeVideo[]): PlanDay[] {
  const activeDays: WorkoutDay[] = ACTIVE_DAY_CONFIG.map(({ day }) => ({ day, title: dayName(day), videos: [] }));
  const available = videos.slice(0, ACTIVE_DAY_CONFIG.reduce((sum, item) => sum + item.capacity, 0));
  available.forEach((video, index) => {
    let target = index % activeDays.length;
    while (activeDays[target].videos.length >= ACTIVE_DAY_CONFIG[target].capacity) {
      target = (target + 1) % activeDays.length;
    }
    activeDays[target].videos.push(video);
  });

  const activeByDay = new Map(activeDays.map(day => [day.day, day]));
  return Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    if (REST_DAYS.has(day)) return { day, title: `${dayName(day)} · Rest day`, videos: [], rest: true };
    return activeByDay.get(day) ?? { day, title: dayName(day), videos: [] };
  });
}

export default function FoundationPlanScreen({ onBack, onPlayVideo }: { onBack: () => void; onPlayVideo: (id: string) => void }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { videos } = useContent();
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const ink = theme.dark ? '#F4F1FF' : '#14306B';
  const muted = theme.dark ? '#BEC7E2' : '#596B96';
  const surface = theme.dark ? '#17235C' : '#FFFFFF';
  const softSurface = theme.dark ? '#222B63' : '#F8F4FB';
  const green = theme.dark ? '#51C58D' : '#278B5A';
  const accent = theme.dark ? '#E879F9' : '#D35BCF';
  const todayDay = ((new Date().getDay() + 6) % 7) + 1;
  const currentWeekKey = mondayKey();

  useEffect(() => {
    let active = true;
    setLoadingProgress(true);
    AsyncStorage.getItem(progressKey(user?.uid ?? 'guest', currentWeekKey))
      .then(raw => {
        if (!active) return;
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        setViewedIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
      })
      .catch(() => { if (active) setViewedIds([]); })
      .finally(() => { if (active) setLoadingProgress(false); });
    return () => { active = false; };
  }, [currentWeekKey, user?.uid]);

  const planDays = useMemo(() => buildPlan(videos), [videos]);
  const allPlanVideos = planDays.flatMap(day => day.videos);
  const totalMinutes = Math.round(allPlanVideos.reduce((sum, video) => sum + video.duration, 0) / 60);
  const averageMinutesPerWorkout = allPlanVideos.length ? Math.round(totalMinutes / ACTIVE_DAY_CONFIG.length) : 0;
  const viewedSet = useMemo(() => new Set(viewedIds), [viewedIds]);

  const openVideo = async (video: HomeVideo) => {
    const next = viewedSet.has(video.video_id) ? viewedIds : [...viewedIds, video.video_id];
    setViewedIds(next);
    try {
      await AsyncStorage.setItem(progressKey(user?.uid ?? 'guest', currentWeekKey), JSON.stringify(next));
    } catch {
      // Keep playback available if local progress storage is temporarily unavailable.
    }
    onPlayVideo(video.video_id);
  };

  const renderPlanDay = (day: PlanDay) => {
    const isToday = day.day === todayDay;
    const completedCount = day.videos.filter(video => viewedSet.has(video.video_id)).length;
    const complete = day.videos.length > 0 && completedCount === day.videos.length;
    const markerStyle = day.rest
      ? { backgroundColor: surface, borderColor: theme.dark ? '#FFFFFF35' : '#C8C4D8' }
      : complete
        ? { backgroundColor: green, borderColor: green }
        : isToday
          ? { backgroundColor: accent, borderColor: accent }
          : { backgroundColor: surface, borderColor: theme.dark ? '#FFFFFF35' : '#C8C4D8' };

    return (
      <View key={day.day} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
        <View style={{ width: 48, alignItems: 'center', paddingTop: 14, zIndex: 1 }}>
          <View style={{ width: 33, height: 33, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', ...markerStyle }}>
            {day.rest ? <Ionicons name="moon-outline" size={15} color={ink} /> : complete ? <Ionicons name="checkmark" size={19} color="#FFFFFF" /> : <Text style={{ color: isToday ? '#FFFFFF' : ink, fontSize: 13, fontWeight: '700' }}>{day.day}</Text>}
          </View>
        </View>

        {day.rest ? (
          <View style={{ flex: 1, minHeight: 98, padding: 16, borderRadius: 25, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.dark ? '#FFFFFF35' : '#D5C8E4', backgroundColor: theme.dark ? '#FFFFFF08' : 'rgba(255,255,255,0.40)', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme.dark ? '#FFFFFF12' : '#EEE5F8', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Ionicons name="moon" size={23} color={ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: ink, fontSize: 16, fontWeight: '800' }}>{day.title}</Text>
              <Text style={{ color: muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>No session. Only the 7 AM and 9 PM stretches.</Text>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, padding: 17, borderRadius: 27, backgroundColor: surface, borderWidth: isToday ? 1 : 0, borderColor: isToday ? accent : 'transparent', shadowColor: '#31215A', shadowOpacity: theme.dark ? 0 : 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: theme.dark ? 0 : 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: ink, fontSize: 16, fontWeight: '800', flex: 1 }}>{day.title}</Text>
              {isToday && <View style={{ borderRadius: 12, backgroundColor: theme.dark ? '#6D3F78' : '#EFA3E9', paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ color: ink, fontSize: 11, fontWeight: '700' }}>Today</Text></View>}
            </View>
            <Text style={{ color: complete ? green : muted, fontSize: 12, marginTop: 5, marginBottom: 12 }}>
              {complete ? 'Done this week' : day.videos.length ? `${day.videos.length} videos · ${Math.round(day.videos.reduce((sum, video) => sum + video.duration, 0) / 60)} min${completedCount ? ` · ${completedCount} done` : ''}` : 'Videos will appear here when available'}
            </Text>

            {day.videos.map((video, index) => {
              const viewed = viewedSet.has(video.video_id);
              return (
                <Pressable key={video.video_id} onPress={() => { void openVideo(video); }} accessibilityRole="button" accessibilityLabel={`${viewed ? 'Watch again' : 'Play'} ${video.title}`} style={{ minHeight: 79, borderRadius: 21, backgroundColor: softSurface, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: index === day.videos.length - 1 ? 0 : 10 }}>
                  <View style={{ width: 60, height: 61, borderRadius: 17, borderWidth: 1, borderColor: theme.dark ? '#FFFFFF16' : '#E7DDF0', backgroundColor: theme.dark ? '#FFFFFF08' : '#F5EAF8', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 8 }}>
                    <Text style={{ color: muted, fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 0.4 }}>VIDEO</Text>
                    <Text style={{ color: muted, fontSize: 9, fontWeight: '800' }}>{index + 1}</Text>
                    <View style={{ position: 'absolute', right: 7, bottom: -1, width: 24, height: 24, borderRadius: 12, backgroundColor: viewed ? green : ink, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={viewed ? 'checkmark' : 'play'} size={12} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={2} style={{ color: ink, fontSize: 14, lineHeight: 19, fontWeight: '700' }}>{video.title}</Text>
                    <Text style={{ color: viewed ? green : muted, fontSize: 12, marginTop: 5 }}>{viewed ? 'Done' : `${Math.max(1, Math.round(video.duration / 60))} min`}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={muted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 23 }}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to Home" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.dark ? '#FFFFFF12' : '#EEDCF3', alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
            <Ionicons name="chevron-back" size={23} color={ink} />
          </Pressable>
          <Text style={{ color: ink, fontSize: 23, fontWeight: '800' }}>Full plan</Text>
        </View>

        <Text style={{ color: muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, lineHeight: 16 }}>YOUR REPEATING{'\n'}7-DAY PLAN</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 5, marginBottom: 22 }}>
          <Text style={{ color: ink, fontSize: 23, fontWeight: '800', marginRight: 12 }}>Foundation</Text>
          <Text style={{ color: ink, fontSize: 13, fontWeight: '700' }}>{allPlanVideos.length} videos</Text>
          <Text style={{ color: muted, fontSize: 13 }}> · about {averageMinutesPerWorkout} min a day</Text>
        </View>

        <View style={{ position: 'absolute', top: 177, bottom: 95, left: 24, width: 2, backgroundColor: theme.dark ? '#FFFFFF1C' : '#D9D1E3' }} />
        {loadingProgress ? <ActivityIndicator color={ink} style={{ marginVertical: 44 }} /> : planDays.map(renderPlanDay)}

        <View style={{ marginTop: 22, padding: 18, borderRadius: 19, borderWidth: 1, borderColor: theme.dark ? '#FFFFFF18' : '#E8DFF0', backgroundColor: theme.dark ? '#FFFFFF08' : 'rgba(255,255,255,0.55)' }}>
          <Text style={{ color: muted, fontSize: 13, lineHeight: 21 }}>This is your plan overview. Start or continue your guided session from Home. Videos you open are saved as done on this device.</Text>
        </View>
        {allPlanVideos.length === 0 && !loadingProgress ? <Text style={{ color: muted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>Your plan videos will appear when the video library is available.</Text> : null}
      </ScrollView>
    </Screen>
  );
}
