import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import type { HomeVideo } from '../api/endpoints';
import { useContent } from '../store/ContentContext';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useFavourites } from '../store/FavouritesContext';
import FoundationPlanScreen from './FoundationPlanScreen';

const mondayStart = (date: Date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
};
const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
type EnergyChoice = 'full' | 'short' | 'low';

const ENERGY_CHOICES: { id: EnergyChoice; title: string; description: string }[] = [
  { id: 'full', title: 'Full session', description: 'Warm-up, 3 videos, cool-down · 32 min' },
  { id: 'short', title: 'Short on time', description: 'Just the warm-up · 5 min' },
  { id: 'low', title: 'Low on energy', description: 'Warm-up and cool-down stretches · 11 min' },
];

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const { isFav, toggle } = useFavourites();
  const { videos, loading, error, refresh } = useContent() as {
    videos: HomeVideo[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
  };
  const { width } = useWindowDimensions();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showFoundationPlan, setShowFoundationPlan] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [sessionStage, setSessionStage] = useState<'energy' | 'videos'>('energy');
  const [energyChoice, setEnergyChoice] = useState<EnergyChoice>('full');
  const [monthView, setMonthView] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const firstName = (profile?.name ?? user?.displayName)?.trim().split(/\s+/)[0] || 'there';
  const featured = useMemo(() => videos.slice(0, 3), [videos]);
  const hero = featured[0];
  const sessionVideos = useMemo(() => {
    if (energyChoice === 'full') return featured;
    if (energyChoice === 'short') {
      const warmup = videos.filter(video => /warm[ -]?up|short|quick/i.test(`${video.title} ${video.description}`));
      return (warmup.length ? warmup : [...videos].sort((a, b) => a.duration - b.duration)).slice(0, 1);
    }
    const gentle = videos.filter(video => /stretch|mobility|gentle|relax|cool[ -]?down|warm[ -]?up/i.test(
      `${video.title} ${video.description} ${video.metadata?.categories?.join(' ') ?? ''}`,
    ));
    return (gentle.length ? gentle : [...videos].sort((a, b) => a.duration - b.duration)).slice(0, 2);
  }, [energyChoice, featured, videos]);
  const ink = theme.dark ? '#F4F1FF' : '#14306B';
  const muted = theme.dark ? '#BEC7E2' : '#596B96';
  const surface = theme.dark ? '#17235C' : '#FFFFFF';
  const softSurface = theme.dark ? '#222B63' : 'rgba(255,255,255,0.72)';
  const accent = theme.dark ? '#E879F9' : '#E86FE3';
  const today = new Date();

  const openVideo = (video?: HomeVideo) => {
    if (video) navigation.navigate('SessionDetail', { id: video.video_id });
  };

  const weekDates = useMemo(() => {
    const start = mondayStart(today);
    start.setDate(start.getDate() + calendarOffset * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [calendarOffset]);

  const monthDates = useMemo(() => {
    const month = new Date(today.getFullYear(), today.getMonth() + calendarOffset, 1);
    const firstWeekday = (month.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
    ];
  }, [calendarOffset]);

  const calendarTitle = monthView
    ? new Date(today.getFullYear(), today.getMonth() + calendarOffset, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : calendarOffset === 0 ? 'This week' : weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' - ' + weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const selectedKey = dateKey(selectedDate);
  const renderDay = (date: Date, index: number, compact = false) => {
    const isToday = dateKey(date) === dateKey(today);
    const isSelected = selectedKey === dateKey(date);
    return (
      <Pressable key={dateKey(date)} onPress={() => setSelectedDate(date)} style={{ flex: compact ? 0 : 1, width: compact ? `${100 / 7}%` : undefined, alignItems: 'center', paddingVertical: compact ? 6 : 8 }}>
        {!compact && <Text style={{ color: muted, fontSize: 10, marginBottom: 9 }}>{weekdayLabels[index]}</Text>}
        <View style={{ width: compact ? 34 : 42, height: compact ? 38 : 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? accent : theme.dark ? '#FFFFFF0C' : '#F6F1FA', borderWidth: isSelected ? 2 : 1, borderColor: isToday || isSelected ? accent : theme.dark ? '#FFFFFF18' : '#E7DDF0', borderStyle: isToday || isSelected ? 'solid' : 'dashed' }}>
          <Text style={{ color: isToday ? '#FFFFFF' : ink, fontSize: compact ? 11 : 13, fontWeight: isToday || isSelected ? '700' : '500' }}>{date.getDate()}</Text>
        </View>
      </Pressable>
    );
  };

  if (showFoundationPlan) {
    return <FoundationPlanScreen onBack={() => setShowFoundationPlan(false)} onPlayVideo={id => navigation.navigate('SessionDetail', { id })} />;
  }

  return (
    <>
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 26 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={ink} />}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 4, borderColor: theme.dark ? '#FFFFFF20' : '#FFFFFFA8' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>{firstName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: ink, fontSize: 18, lineHeight: 32, fontWeight: '800' }}>Hi, {firstName}</Text>
            <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>{today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
        </View>

        {loading && !hero ? <ActivityIndicator style={{ marginTop: 64 }} color={ink} /> : error && !hero ? (
          <View style={{ marginHorizontal: 20, padding: 24, borderRadius: 22, backgroundColor: softSurface, alignItems: 'center' }}>
            <Text style={{ color: ink, textAlign: 'center' }}>{error}</Text>
            <Pressable onPress={refresh} style={{ padding: 12 }}><Text style={{ color: accent, fontWeight: '700' }}>Try again</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={{ marginHorizontal: 20, backgroundColor: surface, borderRadius: 28, overflow: 'hidden', shadowColor: '#1B2560', shadowOpacity: theme.dark ? 0 : 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: theme.dark ? 0 : 4 }}>
              <Pressable onPress={() => openVideo(hero)} disabled={!hero} style={{ height: Math.min(224, width * 0.58), backgroundColor: theme.dark ? '#202B5F' : '#D7C8E0' }}>
                {hero?.thumbnail_url ? <Image source={{ uri: hero.thumbnail_url }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                <LinearGradient colors={['rgba(18,28,67,0.10)', 'rgba(18,28,67,0.92)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
                <View style={{ position: 'absolute', top: 18, left: 20, borderRadius: 12, backgroundColor: '#F8ECF8', paddingHorizontal: 12, paddingVertical: 7 }}>
                  <Text style={{ color: ink, fontSize: 11, fontWeight: '600' }}>Day 4 · Foundation</Text>
                </View>
                {hero ? <Pressable onPress={() => toggle(hero.video_id)} hitSlop={10} style={{ position: 'absolute', top: 15, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#07142B88', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={isFav(hero.video_id) ? 'heart' : 'heart-outline'} size={19} color={isFav(hero.video_id) ? '#FF78A8' : '#FFFFFF'} />
                </Pressable> : null}
                <Text style={{ position: 'absolute', left: 22, right: 20, bottom: 22, color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '800' }}>Make time for{ '\n' }yourself</Text>
              </Pressable>

              <View style={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 16 }}>
                <Text style={{ color: muted, fontSize: 14, lineHeight: 22 }}>One guided session, from warm-up to cool-down.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 17 }}>
                  <Ionicons name="time-outline" size={16} color={ink} />
                  <Text style={{ color: ink, fontSize: 12, marginLeft: 7 }}>{hero ? `${Math.max(1, Math.round(hero.duration / 60))} min full session` : '32 min full session'}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={{ color: ink, fontSize: 12 }}>{Math.min(featured.length || 3, 3)} main videos</Text>
                </View>
                <Pressable onPress={() => { setSessionStage('energy'); setSessionModalVisible(true); }} disabled={!hero} style={{ height: 58, borderRadius: 20, backgroundColor: theme.dark ? '#243A83' : '#1B286B', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#1B2560', shadowOpacity: 0.18, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 3 }}>
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginLeft: 12 }}>Start today's session</Text>
                </Pressable>
                <Pressable onPress={() => setDetailsOpen(value => !value)} style={{ marginTop: 17, paddingTop: 15, borderTopWidth: 1, borderTopColor: theme.dark ? '#FFFFFF20' : '#E9E1ED', flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={detailsOpen ? 'caret-down' : 'caret-forward'} size={12} color={ink} />
                  <Text style={{ color: ink, fontSize: 12, marginLeft: 7, flex: 1 }}>What's in this session</Text>
                  <Text style={{ color: muted, fontSize: 11 }}>{featured.length || 3} videos</Text>
                </Pressable>
                {detailsOpen && <View style={{ paddingTop: 8, paddingLeft: 18 }}>
                  {featured.map((video, index) => <Pressable key={video.video_id} onPress={() => openVideo(video)} style={{ paddingVertical: 5, flexDirection: 'row', alignItems: 'center' }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: muted, fontSize: 11 }}>{index + 1}. {video.title}</Text>
                    <Ionicons name="chevron-forward" size={13} color={muted} />
                  </Pressable>)}
                </View>}
              </View>
            </View>

            <Pressable onPress={() => setShowFoundationPlan(true)} accessibilityRole="button" accessibilityLabel="Open the Foundation seven day plan" style={{ marginHorizontal: 20, marginTop: 16, padding: 18, borderRadius: 24, backgroundColor: softSurface, borderWidth: 1, borderColor: theme.dark ? '#FFFFFF18' : '#FFFFFFB8', flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: theme.dark ? '#FFFFFF12' : '#FFFFFFB8', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Ionicons name="library-outline" size={24} color={ink} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: muted, fontSize: 10, letterSpacing: 1.3, fontWeight: '700' }}>YOUR PLAN</Text>
                <Text style={{ color: ink, fontSize: 15, fontWeight: '800', marginTop: 2 }}>Foundation</Text>
                <Text style={{ color: muted, fontSize: 11, marginTop: 5 }}>Next level: Progression</Text>
              </View>
              <Ionicons name="chevron-forward" size={21} color={ink} />
            </Pressable>

            <View style={{ marginHorizontal: 20, marginTop: 28, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: ink, fontSize: 23, fontWeight: '800' }}>Your progress</Text>
                <Text style={{ color: muted, fontSize: 13, marginTop: 5 }}>A little consistency, day by day.</Text>
              </View>
              <Pressable onPress={() => { setMonthView(value => !value); setCalendarOffset(0); }} style={{ minHeight: 42, paddingHorizontal: 14, borderRadius: 16, backgroundColor: softSurface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: ink, fontSize: 12, fontWeight: '600' }}>{monthView ? 'Week view' : 'Month view'}</Text>
                <Ionicons name={monthView ? 'chevron-up' : 'chevron-down'} size={15} color={ink} style={{ marginLeft: 8 }} />
              </Pressable>
            </View>

            <View style={{ marginHorizontal: 20, padding: 18, borderRadius: 28, backgroundColor: softSurface }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                <Pressable onPress={() => setCalendarOffset(value => value - 1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.dark ? '#FFFFFF12' : '#F8F4FB', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={17} color={ink} /></Pressable>
                <Text style={{ color: ink, fontSize: 15, fontWeight: '700', textAlign: 'center', flex: 1 }}>{calendarTitle}</Text>
                <Pressable onPress={() => setCalendarOffset(value => value + 1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.dark ? '#FFFFFF12' : '#F8F4FB', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-forward" size={17} color={ink} /></Pressable>
              </View>

              {monthView ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                  {weekdayLabels.map((label, index) => <View key={`weekday-${index}`} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 5 }}><Text style={{ color: muted, fontSize: 10 }}>{label}</Text></View>)}
                  {monthDates.map((date, index) => date ? renderDay(date, index % 7, true) : <View key={`blank-${index}`} style={{ width: `${100 / 7}%`, height: 50 }} />)}
                </View>
              ) : (
                <View style={{ flexDirection: 'row' }}>{weekDates.map((date, index) => renderDay(date, index))}</View>
              )}

              <View style={{ borderTopWidth: 1, borderTopColor: theme.dark ? '#FFFFFF18' : '#E9E1ED', marginTop: 12, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E9C66', marginRight: 6 }} /><Text style={{ color: muted, fontSize: 10 }}>Completed</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAA019', marginRight: 6 }} /><Text style={{ color: muted, fontSize: 10 }}>Partial</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}><View style={{ width: 13, height: 13, borderRadius: 7, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9B8CB7', backgroundColor: theme.dark ? '#FFFFFF10' : '#F4ECFA', marginRight: 6 }} /><Text style={{ color: muted, fontSize: 10 }}>Rest</Text></View>
                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}><View style={{ width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: muted, marginRight: 6 }} /><Text style={{ color: muted, fontSize: 10 }}>No session</Text><Text style={{ color: muted, fontSize: 10, marginLeft: 12 }}>Selected: {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text></View>
              </View>
              <Text style={{ color: muted, fontSize: 10, marginTop: 7 }}>Your session history will appear here.</Text>
            </View>

            <View style={{ marginHorizontal: 20, marginTop: 30 }}>
              <Text style={{ color: ink, fontSize: 23, fontWeight: '800' }}>Daily stretches</Text>
              <Text style={{ color: muted, fontSize: 13, marginTop: 5, marginBottom: 15 }}>A gentle start. A calmer finish.</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[
                  { time: '7:00 AM', title: 'Wake-up stretch', duration: '4 min', icon: 'walk-outline' as const, tint: theme.dark ? '#152E56' : '#E9F6EF' },
                  { time: '9:00 PM', title: 'Bedtime stretch', duration: '5 min', icon: 'moon-outline' as const, tint: theme.dark ? '#29234D' : '#F0EAF8' },
                ].map((stretch, index) => (
                  <Pressable key={stretch.title} onPress={() => openVideo(featured[index] ?? hero)} style={{ flex: 1, minHeight: 158, padding: 17, borderRadius: 24, backgroundColor: stretch.tint, borderWidth: 1, borderColor: theme.dark ? '#FFFFFF16' : '#FFFFFFB8' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: theme.dark ? '#C9D6FF' : '#25835C', fontSize: 10, fontWeight: '700' }}>{stretch.time}</Text>
                      <Ionicons name={stretch.icon} size={21} color={ink} />
                    </View>
                    <Text style={{ color: ink, fontSize: 15, lineHeight: 21, fontWeight: '700', marginTop: 18, minHeight: 42 }}>{stretch.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ color: ink, fontSize: 12, flex: 1 }}>{stretch.duration}</Text>
                      <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: surface, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="play" size={12} color={ink} /></View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
    <Modal
      visible={sessionModalVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setSessionModalVisible(false)}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,18,42,0.42)' }}>
        <Pressable onPress={() => setSessionModalVisible(false)} style={StyleSheet.absoluteFill} accessibilityLabel="Close session setup" />
        <View style={{ maxHeight: '90%', backgroundColor: theme.dark ? '#10183D' : '#FFFCFF', borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingTop: 12, paddingBottom: 26 }}>
          <View style={{ width: 48, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: theme.dark ? '#FFFFFF30' : '#D9D8E7', marginBottom: 16 }} />
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            {sessionStage === 'videos' ? (
              <Pressable onPress={() => setSessionStage('energy')} hitSlop={10} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.dark ? '#FFFFFF12' : '#F0EFF6', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="chevron-back" size={21} color={ink} />
              </Pressable>
            ) : null}
            <Text style={{ flex: 1, color: ink, fontSize: 23, fontWeight: '800' }}>{sessionStage === 'energy' ? 'Before you start' : 'Your session'}</Text>
            <Pressable onPress={() => setSessionModalVisible(false)} hitSlop={8} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: theme.dark ? '#FFFFFF12' : '#F0EFF6', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={22} color={ink} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 14 }}>
            {sessionStage === 'energy' ? (
              <>
                <Text style={{ color: ink, fontSize: 16, lineHeight: 24, fontWeight: '700', marginBottom: 16 }}>How much time and energy do you have today?</Text>
                {ENERGY_CHOICES.map(choice => {
                  const selected = energyChoice === choice.id;
                  return (
                    <Pressable
                      key={choice.id}
                      onPress={() => setEnergyChoice(choice.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      style={{ minHeight: 92, borderRadius: 23, borderWidth: selected ? 1.5 : 1, borderColor: selected ? ink : theme.dark ? '#FFFFFF20' : '#E5E3EC', backgroundColor: selected ? (theme.dark ? '#1B285B' : '#F7F3FC') : surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17, paddingVertical: 14, marginBottom: 12, shadowColor: '#1B2560', shadowOpacity: theme.dark ? 0 : 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: selected ? 0 : 1, borderColor: '#AAB4D2', backgroundColor: selected ? ink : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                        {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} /> : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: ink, fontSize: 14, fontWeight: '700' }}>{choice.title}</Text>
                        <Text style={{ color: muted, fontSize: 12, lineHeight: 19, marginTop: 6 }}>{choice.description}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            ) : (
              <>
                <Text style={{ color: muted, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
                  {energyChoice === 'full' ? 'Your full session videos are ready.' : energyChoice === 'short' ? 'A shorter option for today.' : 'Gentler movement options for today.'}
                </Text>
                {sessionVideos.map((video, index) => (
                  <Pressable key={video.video_id} onPress={() => { setSessionModalVisible(false); openVideo(video); }} style={{ minHeight: 82, borderRadius: 19, borderWidth: 1, borderColor: theme.dark ? '#FFFFFF20' : '#E7E3ED', backgroundColor: surface, flexDirection: 'row', alignItems: 'center', padding: 11, marginBottom: 10 }}>
                    {video.thumbnail_url ? <Image source={{ uri: video.thumbnail_url }} style={{ width: 64, height: 58, borderRadius: 12, backgroundColor: '#D8D3E2' }} resizeMode="cover" /> : <View style={{ width: 64, height: 58, borderRadius: 12, backgroundColor: theme.dark ? '#29366E' : '#F0EAF7', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="play" size={18} color={ink} /></View>}
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <Text numberOfLines={2} style={{ color: ink, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>{video.title}</Text>
                      <Text style={{ color: muted, fontSize: 11, marginTop: 5 }}>{index + 1} of {sessionVideos.length} · {Math.max(1, Math.round(video.duration / 60))} min</Text>
                    </View>
                    <Ionicons name="play-circle" size={29} color={accent} />
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>

          <Pressable
            onPress={() => sessionStage === 'energy' ? setSessionStage('videos') : (setSessionModalVisible(false), openVideo(sessionVideos[0]))}
            disabled={sessionStage === 'videos' && sessionVideos.length === 0}
            style={{ marginHorizontal: 24, height: 60, borderRadius: 20, backgroundColor: sessionStage === 'videos' && sessionVideos.length === 0 ? muted : (theme.dark ? '#253982' : '#1B286B'), alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: '#1B2560', shadowOpacity: 0.18, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 3 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{sessionStage === 'energy' ? 'Start' : 'Play first video'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    </>
  );
}
