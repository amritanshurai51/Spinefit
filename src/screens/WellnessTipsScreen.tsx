import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { ContentApi, Tip } from '../api/endpoints';
import { useTheme } from '../theme/ThemeContext';
import { useFavourites } from '../store/FavouritesContext';

export default function WellnessTipsScreen() {
  const { theme } = useTheme();
  const { isTipFav, toggleTip } = useFavourites();
  const [tips, setTips] = useState<Tip[]>([]);
  useEffect(() => { ContentApi.tips().then(setTips); }, []);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>Wellness Tips</Text>
        {tips.map(t => (
          <View key={t.id} style={{ marginTop: 20 }}>
            <View>
            <Image source={{ uri: t.image }} style={{ width: '100%', aspectRatio: 1.6, borderRadius: 12, backgroundColor: '#ddd' }} />
            <Pressable onPress={() => toggleTip(t)} hitSlop={10} style={{ position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: 18, backgroundColor: 'rgba(12,24,52,0.72)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={isTipFav(t.id) ? 'heart' : 'heart-outline'} size={19} color={isTipFav(t.id) ? '#FF5C8A' : '#fff'} />
            </Pressable>
            </View>
            <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 8 }}>{t.tag} • {t.readMin} min read • {t.ago}</Text>
            <Text style={{ color: theme.text, fontSize: 19, fontWeight: '800', marginTop: 4 }}>{t.title}</Text>
            <Text style={{ color: theme.subtext, marginTop: 4, lineHeight: 20 }}>{t.summary}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
