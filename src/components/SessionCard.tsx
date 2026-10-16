import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Text } from './Typography';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '../api/endpoints';
import { useTheme } from '../theme/ThemeContext';
import { useFavourites } from '../store/FavouritesContext';

export default function SessionCard({ s, onPress }: { s: Session; onPress: () => void }) {
  const { theme } = useTheme();
  const { isFav, toggle } = useFavourites();
  return (
    <Pressable onPress={onPress} style={{ flex: 1, margin: 6 }}>
      <View>
        <Image source={{ uri: s.thumbnail }} style={{ width: '100%', aspectRatio: 1.55, borderRadius: 10, backgroundColor: '#ccc' }} />
        <View style={{ position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="play" size={12} color="#fff" /><Text style={{ color: '#fff', fontSize: 11, marginLeft: 3 }}>{s.durationMin}Min</Text>
        </View>
        <Pressable hitSlop={10} onPress={() => toggle(s)} style={{ position: 'absolute', right: 8, top: 8 }}>
          <Ionicons name={isFav(s.id) ? 'heart' : 'heart-outline'} size={20} color={isFav(s.id) ? '#FF5C8A' : '#fff'} />
        </Pressable>
      </View>
      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15, marginTop: 8 }}>{s.title}</Text>
      <Text style={{ color: theme.subtext, fontSize: 12 }}>{s.level}</Text>
    </Pressable>
  );
}
