import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Screen } from '../components/ui';
import { ContentApi, Session } from '../api/endpoints';
import { useTheme } from '../theme/ThemeContext';
import { useFavourites } from '../store/FavouritesContext';

function Player({ uri }: { uri: string }) {
  // uri comes from the backend API (HLS .m3u8 or .mp4)
  const player = useVideoPlayer(uri, p => { p.play(); });
  return <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }} fullscreenOptions={{ enable: true }} allowsPictureInPicture nativeControls />;
}

export default function SessionDetailScreen({ route, navigation }: any) {
  const { theme } = useTheme(); const { isFav, toggle } = useFavourites();
  const [s, setS] = useState<Session | null>(null);
  useEffect(() => { ContentApi.session(route.params.id).then(setS); }, []);
  if (!s) return <Screen><ActivityIndicator style={{ marginTop: 80 }} color={theme.text} /></Screen>;
  return (
    <Screen>
      <Pressable onPress={() => navigation.goBack()} style={{ padding: 16 }}><Ionicons name="chevron-back" size={26} color={theme.text} /></Pressable>
      <Player uri={s.videoUrl} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '800', color: theme.text }}>{s.title}</Text>
          <Pressable onPress={() => toggle(s)} hitSlop={10}>
            <Ionicons name={isFav(s.id) ? 'heart' : 'heart-outline'} size={28} color={isFav(s.id) ? '#FF5C8A' : theme.text} />
          </Pressable>
        </View>
        <Text style={{ color: theme.subtext, marginTop: 4 }}>{s.level} • {s.durationMin} min</Text>
        <Text style={{ color: theme.text, marginTop: 16, lineHeight: 22 }}>{s.description}</Text>
      </ScrollView>
    </Screen>
  );
}
