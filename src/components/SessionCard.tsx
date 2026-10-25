import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text } from './Typography';
import { Ionicons } from '@expo/vector-icons';
import { HomeVideo } from '../api/endpoints';
import { useTheme } from '../theme/ThemeContext';
import { useFavourites } from '../store/FavouritesContext';
import { LinearGradient } from 'expo-linear-gradient';
import VideoOverflowMenu from './VideoOverflowMenu';

export default function SessionCard({ v, onPress }: { v: HomeVideo; onPress: () => void }) {
  const { theme } = useTheme();
  const { isFav, toggle } = useFavourites();
  return (
    <Pressable onPress={onPress} style={{ flex: 1, margin: 6 }}>
      <View>
        <Image source={{ uri: v.thumbnail_url ?? undefined }} style={{ width: '100%', aspectRatio: 1.55, borderRadius: 10, backgroundColor: '#ccc' }} />
        <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.72)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%', borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }} />
        <View style={{ position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="play" size={12} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, marginLeft: 3 }}>{Math.max(1, Math.round(v.duration / 60))}Min</Text>
        </View>
        <Pressable hitSlop={10} onPress={() => toggle(v.video_id)} style={{ position: 'absolute', right: 8, top: 8 }}>
          <Ionicons name={isFav(v.video_id) ? 'heart' : 'heart-outline'} size={20} color={isFav(v.video_id) ? '#FF5C8A' : '#fff'} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
        <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '800', fontSize: 15, flex: 1 }}>{v.title}</Text>
        <VideoOverflowMenu video={v} />
      </View>
      <Text style={{ color: theme.subtext, fontSize: 12 }}>{v.metadata?.categories?.[0] ?? v.metadata?.age_rating}</Text>
    </Pressable>
  );
}
