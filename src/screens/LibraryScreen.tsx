import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import type { HomeVideo } from '../api/endpoints';
import { useContent } from '../store/ContentContext';
import { useFavourites } from '../store/FavouritesContext';
import { useTheme } from '../theme/ThemeContext';

type Collection = 'plan' | 'favorites' | 'downloads';
type PlanName = 'Progression' | 'Performance';
type PlanDay = { day: number; rest: boolean; videos: HomeVideo[] };

const capacities: Record<PlanName, number[]> = {
  Progression: [3, 4, 0, 3, 3, 4, 0],
  Performance: [4, 3, 0, 4, 3, 3, 0],
};

function createWeekPlan(videos: HomeVideo[], plan: PlanName): PlanDay[] {
  let cursor = 0;
  return capacities[plan].map((capacity, index) => {
    const day = index + 1;
    if (capacity === 0) return { day, rest: true, videos: [] };
    const items = videos.slice(cursor, cursor + capacity);
    cursor += capacity;
    return { day, rest: false, videos: items };
  });
}

export default function LibraryScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { videos, byId } = useContent() as { videos: HomeVideo[]; byId: (id: string) => HomeVideo | undefined };
  const { ids, isFav, toggle } = useFavourites() as { ids: string[]; isFav: (id: string) => boolean; toggle: (id: string) => Promise<void> };
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState<Collection>('plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('Progression');

  const ink = theme.dark ? '#F4F1FF' : '#14306B';
  const muted = theme.dark ? '#BEC7E2' : '#596B96';
  const surface = theme.dark ? '#17235C' : '#FFFFFF';
  const soft = theme.dark ? '#222B63' : '#F7F3FA';
  const accent = theme.dark ? '#E879F9' : '#E8A0E7';
  const favoriteVideos = ids.map((id: string) => byId(id)).filter((video: HomeVideo | undefined): video is HomeVideo => Boolean(video));
  const filteredVideos = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = collection === 'favorites' ? favoriteVideos : videos;
    return needle ? source.filter(video => `${video.title} ${video.description} ${video.metadata?.categories?.join(' ') ?? ''}`.toLowerCase().includes(needle)) : source;
  }, [collection, favoriteVideos, query, videos]);
  const planDays = useMemo(() => createWeekPlan(filteredVideos, selectedPlan), [filteredVideos, selectedPlan]);
  const planVideos = planDays.flatMap(day => day.videos);
  const totalMinutes = Math.round(planVideos.reduce((sum, video) => sum + video.duration, 0) / 60);
  const minutesPerWorkout = planVideos.length ? Math.round(totalMinutes / 5) : 0;

  const openVideo = (video: HomeVideo) => navigation.navigate('SessionDetail', { id: video.video_id });
  const requestDownload = () => Alert.alert(
    'Offline download unavailable',
    'The video service currently provides HLS streaming URLs, not a complete downloadable video file. Ask the backend developer for a secure MP4 download URL or an offline HLS package endpoint to enable in-app downloads.',
    [{ text: 'OK' }],
  );

  const collectionCard = (kind: 'downloads' | 'favorites', title: string, count: number, icon: 'download-outline' | 'heart') => {
    const active = collection === kind;
    return (
      <Pressable onPress={() => setCollection(kind)} style={{ flex: 1, minHeight: 156, borderRadius: 26, padding: 19, backgroundColor: surface, marginRight: kind === 'downloads' ? 10 : 0, shadowColor: '#31215A', shadowOpacity: theme.dark ? 0 : 0.07, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 2 }}>
        <View style={{ width: 52, height: 52, borderRadius: 19, backgroundColor: active ? accent : (kind === 'downloads' ? (theme.dark ? '#283A82' : '#1E2D77') : '#ECA6E9'), alignItems: 'center', justifyContent: 'center', marginBottom: 17 }}>
          <Ionicons name={icon} size={23} color={kind === 'downloads' && !active ? '#FFFFFF' : ink} />
        </View>
        <Text style={{ color: ink, fontSize: 17, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: muted, fontSize: 12, lineHeight: 19, marginTop: 7 }}>{count} videos{kind === 'downloads' ? ' · plays offline' : ''}</Text>
      </Pressable>
    );
  };

  const videoRow = (video: HomeVideo, index: number) => (
    <View key={video.video_id} style={{ minHeight: 80, borderRadius: 22, padding: 10, backgroundColor: soft, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
      <Pressable onPress={() => openVideo(video)} accessibilityRole="button" accessibilityLabel={`Play ${video.title}`} style={{ width: 60, height: 61, borderRadius: 17, borderWidth: 1, borderColor: theme.dark ? '#FFFFFF16' : '#E0E4F4', backgroundColor: theme.dark ? '#FFFFFF08' : '#E9ECF9', padding: 8, justifyContent: 'flex-start' }}>
        <Text style={{ color: muted, fontSize: 9, lineHeight: 13, fontWeight: '800', letterSpacing: 0.4 }}>VIDEO</Text>
        <Text style={{ color: muted, fontSize: 9, fontWeight: '800' }}>{index + 1}</Text>
        <View style={{ position: 'absolute', right: 6, bottom: -1, width: 24, height: 24, borderRadius: 12, backgroundColor: ink, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="play" size={11} color="#FFFFFF" /></View>
      </Pressable>
      <Pressable onPress={() => openVideo(video)} style={{ flex: 1, marginHorizontal: 12 }}>
        <Text numberOfLines={2} style={{ color: ink, fontSize: 14, lineHeight: 19, fontWeight: '700' }}>{video.title}</Text>
        <Text style={{ color: muted, fontSize: 12, marginTop: 5 }}>{Math.max(1, Math.round(video.duration / 60))} min</Text>
      </Pressable>
      <Pressable onPress={() => { void toggle(video.video_id); }} accessibilityRole="button" accessibilityLabel={`${isFav(video.video_id) ? 'Remove from' : 'Add to'} favourites`} hitSlop={5} style={{ width: 36, height: 38, borderRadius: 14, backgroundColor: theme.dark ? '#FFFFFF08' : '#F5F1FA', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
        <Ionicons name={isFav(video.video_id) ? 'heart' : 'heart-outline'} size={16} color={isFav(video.video_id) ? '#D35BCF' : ink} />
      </Pressable>
      <Pressable onPress={requestDownload} accessibilityRole="button" accessibilityLabel={`Download ${video.title}`} hitSlop={5} style={{ width: 36, height: 38, borderRadius: 14, backgroundColor: theme.dark ? '#FFFFFF08' : '#F5F1FA', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="download-outline" size={16} color={ink} />
      </Pressable>
    </View>
  );

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 24, paddingBottom: 30 }}>
        <Text style={{ color: ink, fontSize: 36, lineHeight: 43, fontWeight: '800', marginBottom: 17 }}>Library</Text>

        <View style={{ height: 57, borderRadius: 21, paddingHorizontal: 18, backgroundColor: surface, flexDirection: 'row', alignItems: 'center', shadowColor: '#34205D', shadowOpacity: theme.dark ? 0 : 0.05, shadowRadius: 9, elevation: 1 }}>
          <Ionicons name="search-outline" size={19} color={muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search videos or a level..." placeholderTextColor={muted} returnKeyType="search" style={{ flex: 1, marginLeft: 13, color: ink, fontFamily: 'Sora_400Regular', fontSize: 13, paddingVertical: 0 }} />
          {query.length > 0 && <Pressable onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={muted} /></Pressable>}
        </View>

        <Text style={{ color: ink, fontSize: 21, fontWeight: '800', marginTop: 32, marginBottom: 17 }}>Your playlists</Text>
        <View style={{ flexDirection: 'row' }}>
          {collectionCard('downloads', 'Downloads', 0, 'download-outline')}
          {collectionCard('favorites', 'Favourites', ids.length, 'heart')}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 34, marginBottom: 14 }}>
          <Text style={{ color: ink, fontSize: 21, fontWeight: '800' }}>Other plans</Text>
          <View style={{ borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: surface }}><Text style={{ color: muted, fontSize: 10 }}>Strengthening is on Home</Text></View>
        </View>
        <Text style={{ color: muted, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>Watch any video. Your plan stays Foundation.</Text>

        <View style={{ height: 51, borderRadius: 20, backgroundColor: theme.dark ? '#FFFFFF12' : '#EEE8F4', padding: 4, flexDirection: 'row', marginBottom: 20 }}>
          {(['Progression', 'Performance'] as const).map(plan => {
            const active = selectedPlan === plan;
            return <Pressable key={plan} onPress={() => { setSelectedPlan(plan); setCollection('plan'); }} style={{ flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? (theme.dark ? '#253982' : '#202F78') : 'transparent', shadowColor: '#1B2560', shadowOpacity: active ? 0.15 : 0, shadowRadius: 7, elevation: active ? 2 : 0 }}>
              <Text style={{ color: active ? '#FFFFFF' : ink, fontSize: 13, fontWeight: '700' }}>{plan}</Text>
            </Pressable>;
          })}
        </View>

        {collection === 'plan' ? (
          <>
            <Text style={{ color: muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 }}>7-DAY PLAN</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 5, marginBottom: 18 }}>
              <Text style={{ color: ink, fontSize: 22, fontWeight: '800', marginRight: 12 }}>{selectedPlan}</Text>
              <Text style={{ color: ink, fontSize: 13, fontWeight: '700' }}>{planVideos.length} videos</Text>
              <Text style={{ color: muted, fontSize: 13 }}> · about {minutesPerWorkout} min a day</Text>
            </View>
            <View>
              <View pointerEvents="none" style={{ position: 'absolute', top: 20, bottom: 34, left: 20, width: 2, backgroundColor: theme.dark ? '#FFFFFF1C' : '#D9D1E3' }} />
              {planDays.map(day => (
                <View key={day.day} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
                  <View style={{ width: 48, alignItems: 'center', paddingTop: 14, zIndex: 1 }}>
                    <View style={{ width: 33, height: 33, borderRadius: 17, borderWidth: 1, borderColor: theme.dark ? '#FFFFFF35' : '#C8C4D8', backgroundColor: day.rest ? surface : surface, alignItems: 'center', justifyContent: 'center' }}>
                      {day.rest ? <Ionicons name="moon-outline" size={15} color={ink} /> : <Text style={{ color: ink, fontSize: 13, fontWeight: '700' }}>{day.day}</Text>}
                    </View>
                  </View>
                  {day.rest ? (
                    <View style={{ flex: 1, minHeight: 98, padding: 16, borderRadius: 25, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.dark ? '#FFFFFF35' : '#D5C8E4', backgroundColor: theme.dark ? '#FFFFFF08' : 'rgba(255,255,255,0.4)', flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme.dark ? '#FFFFFF12' : '#EEE5F8', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}><Ionicons name="moon" size={23} color={ink} /></View>
                      <View style={{ flex: 1 }}><Text style={{ color: ink, fontSize: 16, fontWeight: '800' }}>Day {day.day} · Rest day</Text><Text style={{ color: muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>No session. Only the 7 AM and 9 PM stretches.</Text></View>
                    </View>
                  ) : (
                    <View style={{ flex: 1, padding: 16, borderRadius: 27, backgroundColor: surface, shadowColor: '#31215A', shadowOpacity: theme.dark ? 0 : 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: theme.dark ? 0 : 2 }}>
                      <Text style={{ color: ink, fontSize: 16, fontWeight: '800' }}>Day {day.day}</Text>
                      <Text style={{ color: muted, fontSize: 12, marginTop: 5, marginBottom: 12 }}>{day.videos.length} videos · {Math.round(day.videos.reduce((sum, video) => sum + video.duration, 0) / 60)} min</Text>
                      {day.videos.map((video, index) => videoRow(video, index))}
                      {day.videos.length === 0 && <Text style={{ color: muted, fontSize: 12, paddingVertical: 12 }}>Videos will appear here when available.</Text>}
                    </View>
                  )}
                </View>
              ))}
            </View>
            {videos.length === 0 && <Text style={{ color: muted, textAlign: 'center', fontSize: 12, marginTop: 10 }}>The video list will load when your account can connect to the server.</Text>}
          </>
        ) : collection === 'favorites' ? (
          <>
            <View style={{ borderRadius: 24, backgroundColor: surface, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: '#ECA6E9', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}><Ionicons name="heart" size={25} color={ink} /></View>
              <View><Text style={{ color: ink, fontSize: 18, fontWeight: '800' }}>Favourites</Text><Text style={{ color: muted, fontSize: 12, marginTop: 5 }}>{favoriteVideos.length} videos</Text></View>
            </View>
            {!!favoriteVideos.length && <Pressable onPress={() => openVideo(favoriteVideos[0])} style={{ height: 58, borderRadius: 19, backgroundColor: '#202F78', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}><Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Play all</Text></Pressable>}
            {filteredVideos.length ? filteredVideos.map(videoRow) : <Text style={{ color: muted, textAlign: 'center', fontSize: 13, marginTop: 24 }}>{query ? 'No favourites match your search.' : 'Your favourite videos will appear here.'}</Text>}
          </>
        ) : (
          <View style={{ minHeight: 210, alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 24, backgroundColor: surface }}>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: theme.dark ? '#283A82' : '#1E2D77', alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}><Ionicons name="download-outline" size={24} color="#FFFFFF" /></View>
            <Text style={{ color: ink, fontSize: 16, fontWeight: '800' }}>No offline videos yet</Text>
            <Text style={{ color: muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 }}>Use a video's download button to save it here. Offline downloads need a downloadable video file from the video service.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
