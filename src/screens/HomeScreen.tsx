import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text, TextInput } from '../components/Typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../components/ui';
import SessionCard from '../components/SessionCard';
import { ContentApi, Session } from '../api/endpoints';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../store/AuthContext';
import { useFavourites } from '../store/FavouritesContext';

const CATS = ['All', 'Posture', 'Back pain', 'Neck & shoulder', 'Strength'];
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

function VideoCard({ session, onPress, onFavorite, favorite }: { session: Session; onPress: () => void; onFavorite: () => void; favorite: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ width: 174, marginRight: 12 }}>
      <Pressable onPress={onPress} style={{ height: 112, borderRadius: 13, overflow: 'hidden', backgroundColor: theme.card }}>
        <Image source={{ uri: session.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['#07142B00', '#07142BB8']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', bottom: 8, left: 9, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="play" size={11} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10, marginLeft: 4 }}>{session.durationMin} Min</Text>
        </View>
        <Pressable onPress={onFavorite} hitSlop={8} style={{ position: 'absolute', top: 7, right: 7, width: 27, height: 27, borderRadius: 14, backgroundColor: '#07142B99', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={15} color={favorite ? '#FF5C8A' : '#fff'} />
        </Pressable>
      </Pressable>
      <Pressable onPress={onPress}>
        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 12, fontWeight: '700', marginTop: 6 }}>{session.title}</Text>
        <Text numberOfLines={1} style={{ color: theme.subtext, fontSize: 10, marginTop: 2 }}>{session.level}</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isFav, toggle } = useFavourites();
  const { width } = useWindowDimensions();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [days, setDays] = useState(0);
  const [data, setData] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      ContentApi.sessions({ q: searchOpen ? q : '', category: searchOpen ? cat : 'All', days: searchOpen ? days : 0 })
        .then(sessions => { if (!cancelled) setData(sessions); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, searchOpen ? 250 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, cat, days, searchOpen]);

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const initials = firstName.slice(0, 1).toUpperCase();
  const featured = data.slice(0, 3);
  const featuredWidth = width - 32;
  const openSession = (session: Session) => navigation.navigate('SessionDetail', { id: session.id });

  const renderSearch = () => (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 14 }}>
        <Pressable onPress={() => { setSearchOpen(false); setQ(''); setCat('All'); setDays(0); }} hitSlop={10} style={{ padding: 6, marginRight: 7 }}>
          <Ionicons name="chevron-back" size={23} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <Ionicons name="search" size={18} color={theme.subtext} />
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Search sessions, focus areas..." placeholderTextColor={theme.subtext} style={{ flex: 1, marginHorizontal: 8, color: theme.text }} />
          {!!q && <Pressable onPress={() => setQ('')}><Ionicons name="close-circle" size={18} color={theme.subtext} /></Pressable>}
        </View>
      </View>
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={session => session.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
        ListHeaderComponent={<View style={{ paddingHorizontal: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>EXPLORE SESSIONS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 12, height: 34 }}>
              <Ionicons name="options" size={16} color={theme.chipActiveText} /><Text style={{ color: theme.chipActiveText, fontWeight: '700', marginLeft: 6 }}>Filter</Text>
            </View>
          </View>
          <Text style={{ color: theme.text, fontWeight: '600', marginTop: 14, marginBottom: 8 }}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>{CATS.map(category => <Chip key={category} label={category} active={cat === category} onPress={() => setCat(category)} />)}</ScrollView>
          <Text style={{ color: theme.text, fontWeight: '600', marginTop: 14, marginBottom: 8 }}>By Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {DATES.map(date => <Chip key={date.l} icon="time-outline" label={date.l} active={days === date.d} onPress={() => setDays(date.d)} />)}
          </ScrollView>
        </View>}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} color={theme.text} /> : <Text style={{ textAlign: 'center', color: theme.subtext, marginTop: 40 }}>No sessions found</Text>}
        renderItem={({ item }) => <SessionCard s={item} onPress={() => openSession(item)} />}
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

        {loading && data.length === 0 ? <ActivityIndicator style={{ marginTop: 100 }} color={theme.text} /> : <>
          {featured.length > 0 && <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={event => setFeaturedIndex(Math.round(event.nativeEvent.contentOffset.x / featuredWidth))}
            >
              {featured.map((session, index) => (
                <View key={`${session.id}-${index}`} style={{ width: featuredWidth, height: 242, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: theme.card }}>
                  <Image source={{ uri: session.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  <LinearGradient colors={['#05102C1C', '#06132CF2']} locations={[0.28, 1]} style={StyleSheet.absoluteFill} />
                  <View style={{ position: 'absolute', top: 12, left: 12, borderRadius: 10, backgroundColor: '#F1A8EDCC', paddingHorizontal: 9, paddingVertical: 5 }}>
                    <Text style={{ color: '#28164A', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>THIS WEEK’S PICK</Text>
                  </View>
                  <Pressable onPress={() => toggle(session)} hitSlop={8} style={{ position: 'absolute', top: 11, right: 11, width: 32, height: 32, borderRadius: 16, backgroundColor: '#07142B99', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={isFav(session.id) ? 'heart' : 'heart-outline'} size={17} color={isFav(session.id) ? '#FF5C8A' : '#fff'} />
                  </Pressable>
                  <View style={{ position: 'absolute', left: 13, right: 13, bottom: 12 }}>
                    <Text numberOfLines={1} style={{ color: '#fff', fontSize: 21, fontWeight: '800' }}>{session.title}</Text>
                    <Text numberOfLines={2} style={{ color: '#E2E8F7', fontSize: 11, lineHeight: 16, marginTop: 3 }}>
                      A gentle guided session to improve mobility, ease tension, and support your daily recovery.
                    </Text>
                    <Pressable onPress={() => openSession(session)} style={{ height: 37, borderRadius: 12, backgroundColor: '#F0A8EC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 9 }}>
                      <Ionicons name="play" size={13} color="#241443" />
                      <Text style={{ color: '#241443', fontSize: 12, fontWeight: '800', marginLeft: 7 }}>View session</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 5, gap: 5 }}>
              {featured.map((session, index) => <View key={session.id + index} style={{ width: featuredIndex === index ? 15 : 5, height: 5, borderRadius: 4, backgroundColor: featuredIndex === index ? theme.accent : theme.subtext + '88' }} />)}
            </View>
          </>}

          {SECTIONS.map(section => {
            const sessions = data.filter(session => session.category === section.category);
            if (!sessions.length) return null;
            return (
              <View key={section.title} style={{ marginTop: 18 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginHorizontal: 18, marginBottom: 9 }}>{section.title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
                  {sessions.map(session => <VideoCard key={session.id} session={session} onPress={() => openSession(session)} favorite={isFav(session.id)} onFavorite={() => toggle(session)} />)}
                </ScrollView>
              </View>
            );
          })}
        </>}
      </ScrollView>}
    </Screen>
  );
}
