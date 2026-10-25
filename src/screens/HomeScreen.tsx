import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text, TextInput } from '../components/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/ui';
import SessionCard from '../components/SessionCard';
import VideoOverflowMenu from '../components/VideoOverflowMenu';
import { HomeVideo } from '../api/endpoints';
import { useContent } from '../store/ContentContext';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useFavourites } from '../store/FavouritesContext';

const DATES = [{ l: 'Any time', d: 0 }, { l: 'Past 7 days', d: 7 }, { l: 'Past 30 days', d: 30 }, { l: 'Past 90 days', d: 90 }];
const SECTIONS = [
  { title: 'Back Mobility', category: 'Back pain' },
  { title: 'Elbow Relief', category: 'Neck & shoulder' },
  { title: 'Spine Mobility', category: 'Posture' },
  { title: 'Strength & Stability', category: 'Strength' },
];

export const Chip = ({ label, active, onPress, icon }: any) => {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 34, borderRadius: 17, marginRight: 8,
      backgroundColor: active ? theme.chipActive : theme.chip, borderWidth: 1, borderColor: theme.border + '55' }}>
      {icon && <Ionicons name={icon} size={14} color={active ? theme.chipActiveText : theme.text} style={{ marginRight: 5 }} />}
      <Text style={{ color: active ? theme.chipActiveText : theme.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
};

function VideoCard({ session, onPress, onFavorite, favorite }: { session: HomeVideo; onPress: () => void; onFavorite: () => void; favorite: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ width: 174, marginRight: 12 }}>
      <Pressable onPress={onPress} style={{ height: 112, borderRadius: 13, overflow: 'hidden', backgroundColor: theme.card }}>
        <Image source={{ uri: session.thumbnail_url ?? undefined }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', bottom: 8, left: 9, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="play" size={11} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10, marginLeft: 4 }}>{Math.max(1, Math.round(session.duration / 60))} Min</Text>
        </View>
        <Pressable onPress={onFavorite} hitSlop={8} style={{ position: 'absolute', top: 7, right: 7, width: 27, height: 27, borderRadius: 14, backgroundColor: '#07142B99', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={15} color={favorite ? '#FF5C8A' : '#fff'} />
        </Pressable>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Pressable onPress={onPress} style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{session.title}</Text>
        </Pressable>
        <VideoOverflowMenu video={session} />
      </View>
      <Pressable onPress={onPress}>
        <Text numberOfLines={1} style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{session.metadata?.categories?.[0] ?? session.metadata?.age_rating}</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const { isFav, toggle } = useFavourites();
  const { feed, videos, loading, error, refresh } = useContent();
  const { width } = useWindowDimensions();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [days, setDays] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const cats = ['All', ...(feed?.categories.map((category: any) => category.name) ?? [])];
  const data: HomeVideo[] = useMemo(() => {
    const inCategory = cat === 'All' ? videos : feed?.categories.find((category: any) => category.name === cat)?.videos ?? [];
    const since = days ? Date.now() - days * 86400000 : 0;
    return inCategory.filter((video: HomeVideo) =>
      (!q || video.title.toLowerCase().includes(q.toLowerCase())) &&
      (!since || new Date(video.released_at).getTime() >= since));
  }, [videos, feed, cat, days, q]);

  const firstName = (profile?.name ?? user?.displayName)?.trim().split(/\s+/)[0] || 'there';
  const initials = firstName.slice(0, 1).toUpperCase();
  const featured = data.slice(0, 3);
  const featuredWidth = width - 32;
  const openSession = (session: HomeVideo) => navigation.navigate('SessionDetail', { id: session.video_id });

  const renderSearch = () => (
    <View style={{ flex: 1 }}>
      <View style={{ marginHorizontal: 18, marginTop: 8, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: theme.dark ? theme.border : '#F6B5EC', backgroundColor: theme.dark ? theme.input : '#FCEFFC', paddingHorizontal: 16,
          shadowColor: '#12316B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: theme.dark ? 0 : 0.12, shadowRadius: 11.3, elevation: theme.dark ? 0 : 3 }}>
          <Ionicons name="search" size={23} color={theme.dark ? theme.text : '#12316B'} />
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Search sessions, focus areas..." placeholderTextColor={theme.dark ? theme.subtext : '#12316B'} style={{ flex: 1, marginHorizontal: 12, color: theme.dark ? theme.text : '#12316B', fontSize: 16 }} />
          <Pressable accessibilityRole="button" accessibilityLabel={q ? 'Clear search' : 'Close search'} onPress={() => {
            if (q) setQ('');
            else { setSearchOpen(false); setCat('All'); setDays(0); }
          }} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.dark ? theme.text : '#12316B'} />
          </Pressable>
        </View>
      </View>
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(video: HomeVideo) => video.video_id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading && !!feed} onRefresh={refresh} />}
        ListHeaderComponent={<View style={{ paddingHorizontal: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>EXPLORE SESSIONS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, borderRadius: 47, paddingHorizontal: 12, height: 34 }}>
              <Ionicons name="options" size={16} color={theme.chipActiveText} style={{ transform: [{ rotate: '90deg' }] }} /><Text style={{ color: theme.chipActiveText, fontWeight: '700', marginLeft: 6 }}>Filter</Text>
            </View>
          </View>
          <Text style={{ color: theme.text, fontWeight: '600', marginTop: 14, marginBottom: 8 }}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>{cats.map(category => <Chip key={category} label={category} active={cat === category} onPress={() => setCat(category)} />)}</ScrollView>
          <Text style={{ color: theme.text, fontWeight: '600', marginTop: 14, marginBottom: 8 }}>By Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {DATES.map(date => <Chip key={date.l} icon="time-outline" label={date.l} active={days === date.d} onPress={() => setDays(date.d)} />)}
          </ScrollView>
        </View>}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} color={theme.text} /> : error ? <View style={{ alignItems: 'center', marginTop: 40 }}><Text style={{ textAlign: 'center', color: theme.subtext }}>{error}</Text><Text onPress={refresh} style={{ color: theme.text, fontWeight: '700', marginTop: 12 }}>Retry</Text></View> : <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>No sessions found</Text>}
        renderItem={({ item }) => <SessionCard v={item} onPress={() => openSession(item)} />}
      />
    </View>
  );

  return (
    <Screen>
      {searchOpen ? renderSearch() : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 22 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <Text style={{ color: theme.chipActiveText, fontSize: 16, fontWeight: '800' }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>Hi, {firstName}</Text>
              <Text style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>
          <Pressable onPress={() => setSearchOpen(true)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search" size={18} color={theme.cardText} />
          </Pressable>
        </View>

        {loading && data.length === 0 ? <ActivityIndicator style={{ marginTop: 100 }} color={theme.text} /> : error && data.length === 0 ? <View style={{ alignItems: 'center', padding: 28 }}><Text style={{ color: theme.subtext, textAlign: 'center' }}>{error}</Text><Text onPress={refresh} style={{ color: theme.text, fontWeight: '700', marginTop: 12 }}>Retry</Text></View> : <>
          {featured.length > 0 && <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={event => setFeaturedIndex(Math.round(event.nativeEvent.contentOffset.x / featuredWidth))}
            >
              {featured.map((session, index) => (
                <View key={`${session.video_id}-${index}`} style={{ width: featuredWidth, height: 242, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: theme.card }}>
                  <Image source={{ uri: session.thumbnail_url ?? undefined }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.88)']} locations={[0.28, 1]} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', top: 12, left: 12, borderRadius: 12, backgroundColor: '#e6c5e5cc', paddingHorizontal: 9, paddingVertical: 5 }}>
                    <Text style={{ color: '#28164A', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>THIS WEEK’S PICK</Text>
                  </View>
                  <Pressable onPress={() => toggle(session.video_id)} hitSlop={8} style={{ position: 'absolute', top: 11, right: 11, width: 32, height: 32, borderRadius: 16, backgroundColor: '#07142B99', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={isFav(session.video_id) ? 'heart' : 'heart-outline'} size={17} color={isFav(session.video_id) ? '#FF5C8A' : '#fff'} />
                  </Pressable>
                  <View style={{ position: 'absolute', left: 13, right: 13, bottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text numberOfLines={1} style={{ color: '#fff', fontSize: 21, fontWeight: '800', flex: 1 }}>{session.title}</Text>
                      <VideoOverflowMenu video={session} />
                    </View>
                    <Text numberOfLines={2} style={{ color: '#E2E8F7', fontSize: 11, lineHeight: 16, marginTop: 3 }}>
                      {session.description}
                    </Text>
                    <Pressable onPress={() => openSession(session)} style={{ height: 40, borderRadius: 12, backgroundColor: '#F0A8EC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 9 }}>
                      <Ionicons name="play" size={13} color="#241443" />
                      <Text style={{ color: '#241443', fontSize: 12, fontWeight: '800', marginLeft: 7 }}>View session</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 5, gap: 5 }}>
              {featured.map((session, index) => <View key={session.video_id + index} style={{ width: featuredIndex === index ? 15 : 5, height: 5, borderRadius: 4, backgroundColor: featuredIndex === index ? theme.accent : theme.subtext + '88' }} />)}
            </View>
          </>}

          {SECTIONS.map(section => {
            const sessions = data.filter(session => session.metadata?.categories?.includes(section.category));
            if (!sessions.length) return null;
            return (
              <View key={section.title} style={{ marginTop: 18 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginHorizontal: 18, marginBottom: 9 }}>{section.title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
                  {sessions.map(session => <VideoCard key={session.video_id} session={session} onPress={() => openSession(session)} favorite={isFav(session.video_id)} onFavorite={() => toggle(session.video_id)} />)}
                </ScrollView>
              </View>
            );
          })}
        </>}
      </ScrollView>}
    </Screen>
  );
}
