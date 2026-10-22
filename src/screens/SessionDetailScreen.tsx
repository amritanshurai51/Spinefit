import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Screen } from '../components/ui';
import { Api, PlayInfo } from '../api/endpoints';
import { useContent } from '../store/ContentContext';
import { useTheme } from '../theme/ThemeContext';
import { useFavourites } from '../store/FavouritesContext';

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri, contentType: 'hls' } as any, instance => { instance.play(); });
  return <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }} fullscreenOptions={{ enable: true }} allowsPictureInPicture nativeControls />;
}

export default function SessionDetailScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { isFav, toggle } = useFavourites();
  const { refresh } = useContent();
  const [s, setS] = useState<PlayInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      setS(await Api.video(route.params.id));
    } catch (error: any) {
      if (error?.code === 'video_not_found' || error?.code === 'bunny_video_not_found') {
        setErr('This video is no longer available.');
        refresh();
      } else if (error?.code === 'video_not_ready') {
        setErr('Not available yet, please try later.');
      } else if (error?.code === 'video_service_unavailable') {
        setErr('Video service is not responding. Please retry.');
      } else {
        setErr(error?.detail ?? 'Could not load the video.');
      }
    }
  };

  useEffect(() => { load(); }, []);

  if (err) return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} style={{ padding: 16 }}><Ionicons name="chevron-back" size={26} color={theme.text} /></Pressable>
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: theme.text, textAlign: 'center' }}>{err}</Text>
        <Text onPress={load} style={{ color: theme.text, fontWeight: '700', marginTop: 16 }}>Retry</Text>
      </View>
    </Screen>
  );
  if (!s) return <Screen><ActivityIndicator style={{ marginTop: 80 }} color={theme.text} /></Screen>;

  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} style={{ padding: 16 }}><Ionicons name="chevron-back" size={26} color={theme.text} /></Pressable>
      <Player uri={s.hls_url} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '800', color: theme.text }}>{s.title}</Text>
          <Pressable onPress={() => toggle(s.video_id)} hitSlop={10}>
            <Ionicons name={isFav(s.video_id) ? 'heart' : 'heart-outline'} size={28} color={isFav(s.video_id) ? '#FF5C8A' : theme.text} />
          </Pressable>
        </View>
        <Text style={{ color: theme.subtext, marginTop: 4 }}>{s.metadata?.categories?.join(' · ')} · {Math.round(s.duration / 60)} min</Text>
        <Text style={{ color: theme.text, marginTop: 16, lineHeight: 22 }}>{s.description}</Text>
      </ScrollView>
    </Screen>
  );
}
