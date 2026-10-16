import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { Session, Tip } from '../api/endpoints';
import { useFavourites } from '../store/FavouritesContext';
import { useTheme } from '../theme/ThemeContext';

type Props = { navigation: any };
type SavedItemProps = { title: string; image: string; duration: string; onPress: () => void; onToggle: () => void; saved: boolean; width: number };

function VideoTile({ title, image, duration, onPress, onToggle, saved, width }: SavedItemProps) {
  return (
    <View style={{ width, marginBottom: 17 }}>
      <Pressable onPress={onPress} style={styles.tileImageWrap}>
        <Image source={{ uri: image }} style={styles.tileImage} />
        <View style={styles.imageShade} />
        <Pressable onPress={onToggle} hitSlop={9} style={styles.heartButton}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={15} color={saved ? '#FF315B' : '#fff'} />
        </Pressable>
        <View style={styles.duration}><Ionicons name="play" size={9} color="#fff" /><Text style={styles.durationText}>{duration}</Text></View>
      </Pressable>
      <Text numberOfLines={1} style={styles.tileTitle}>{title}</Text>
    </View>
  );
}

function TipTile({ tip, width, onToggle, saved }: { tip: Tip; width: number; onToggle: () => void; saved: boolean }) {
  return (
    <View style={{ width, marginBottom: 17 }}>
      <View style={styles.tileImageWrap}>
        <Image source={{ uri: tip.image }} style={styles.tileImage} />
        <View style={styles.imageShade} />
        <Pressable onPress={onToggle} hitSlop={9} style={styles.heartButton}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={15} color={saved ? '#FF315B' : '#fff'} />
        </Pressable>
        <View style={styles.duration}><Ionicons name="time-outline" size={10} color="#fff" /><Text style={styles.durationText}>{tip.readMin} min</Text></View>
      </View>
      <Text numberOfLines={1} style={styles.tileTitle}>{tip.title}</Text>
    </View>
  );
}

export default function FavouritesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { items, toggle, tipItems, toggleTip, isTipFav, clearVideos, clearTips } = useFavourites();
  const [tab, setTab] = useState<'videos' | 'tips'>('videos');
  const isVideos = tab === 'videos';
  const totalMinutes = items.reduce((sum: number, session: Session) => sum + session.durationMin, 0);
  const gridWidth = (screenWidth - 56) / 2;
  const latestVideo = items[0];
  const latestTip = tipItems[0];

  const clearSaved = () => {
    const count = isVideos ? items.length : tipItems.length;
    if (!count) return;
    Alert.alert('Clear saved items?', `Remove all ${isVideos ? 'saved videos' : 'saved wellness tips'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: isVideos ? clearVideos : clearTips },
    ]);
  };

  const openSession = (session: Session) => navigation.navigate('SessionDetail', { id: session.id });

  return (
    <Screen style={{ backgroundColor: theme.dark ? '#061735' : '#F7F4FC' }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.navigate('Home')} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle}>Favorites</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
        <Text style={styles.heading}>Everything you{ '\n' }keep, in one place</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summary}>{items.length} videos · {totalMinutes} min of guided movement</Text>
          <Pressable onPress={clearSaved} hitSlop={8}>
            <Text style={styles.clearText}>Clear all</Text>
          </Pressable>
        </View>

        <View style={styles.segment}>
          <Pressable onPress={() => setTab('videos')} style={[styles.segmentButton, isVideos && styles.segmentActive]}>
            <Ionicons name="videocam-outline" size={13} color={isVideos ? '#20123C' : '#A8B6D1'} />
            <Text style={[styles.segmentText, isVideos && styles.segmentTextActive]}>Videos</Text>
            <Text style={[styles.countBubble, isVideos && styles.countBubbleActive]}>{items.length}</Text>
          </Pressable>
          <Pressable onPress={() => setTab('tips')} style={[styles.segmentButton, !isVideos && styles.segmentActive]}>
            <Ionicons name="leaf-outline" size={13} color={!isVideos ? '#20123C' : '#A8B6D1'} />
            <Text style={[styles.segmentText, !isVideos && styles.segmentTextActive]}>Wellness Tips</Text>
            <Text style={[styles.countBubble, !isVideos && styles.countBubbleActive]}>{tipItems.length}</Text>
          </Pressable>
        </View>

        {isVideos ? (
          <>
            {latestVideo ? <>
              <Text style={styles.sectionLabel}>LATEST SAVE</Text>
              <Pressable onPress={() => openSession(latestVideo)} style={styles.featured}>
                <Image source={{ uri: latestVideo.thumbnail }} style={styles.featuredImage} />
                <View style={styles.featuredShade} />
                <Pressable onPress={() => toggle(latestVideo)} hitSlop={10} style={styles.featuredHeart}>
                  <Ionicons name="heart" size={15} color="#FF315B" />
                </Pressable>
                <View style={styles.featuredCopy}>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.featuredTitle}>{latestVideo.title}</Text>
                    <Text style={styles.featuredMeta}>{latestVideo.durationMin} min</Text>
                  </View>
                  <View style={styles.playButton}><Ionicons name="play" size={16} color="#32134D" /></View>
                </View>
              </Pressable>
            </> : null}
            <View style={styles.listHeadingRow}>
              <Text style={styles.sectionLabel}>{items.length ? 'ALL SAVED VIDEOS' : 'SAVED VIDEOS'}</Text>
              {!!items.length && <Text style={styles.sectionCount}>{items.length} saved</Text>}
            </View>
            {items.length ? <View style={styles.grid}>
              {items.map((session: Session) => <VideoTile key={session.id} title={session.title} image={session.thumbnail}
                duration={`${session.durationMin} Min`} width={gridWidth} onPress={() => openSession(session)}
                onToggle={() => toggle(session)} saved />)}
            </View> : <EmptyCollection icon="heart-outline" message="Your saved videos will appear here." />}
          </>
        ) : (
          <>
            {latestTip ? <>
              <Text style={styles.sectionLabel}>LATEST SAVE</Text>
              <View style={styles.featured}>
                <Image source={{ uri: latestTip.image }} style={styles.featuredImage} />
                <View style={styles.featuredShade} />
                <Pressable onPress={() => toggleTip(latestTip)} hitSlop={10} style={styles.featuredHeart}>
                  <Ionicons name="heart" size={15} color="#FF315B" />
                </Pressable>
                <View style={styles.featuredCopy}>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.featuredTitle}>{latestTip.title}</Text>
                    <Text style={styles.featuredMeta}>{latestTip.readMin} min read</Text>
                  </View>
                  <View style={styles.playButton}><Ionicons name="arrow-forward" size={16} color="#32134D" /></View>
                </View>
              </View>
            </> : null}
            <View style={styles.listHeadingRow}>
              <Text style={styles.sectionLabel}>{tipItems.length ? 'ALL SAVED TIPS' : 'SAVED WELLNESS TIPS'}</Text>
              {!!tipItems.length && <Text style={styles.sectionCount}>{tipItems.length} saved</Text>}
            </View>
            {tipItems.length ? <View style={styles.grid}>
              {tipItems.map((tip: Tip) => <TipTile key={tip.id} tip={tip} width={gridWidth} saved={isTipFav(tip.id)} onToggle={() => toggleTip(tip)} />)}
            </View> : <EmptyCollection icon="leaf-outline" message="Save a wellness tip to find it here." />}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function EmptyCollection({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return <View style={styles.empty}>
    <View style={styles.emptyIcon}><Ionicons name={icon} size={23} color="#F4B3F5" /></View>
    <Text style={styles.emptyText}>{message}</Text>
  </View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingBottom: 28 },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  backButton: { width: 30, height: 30, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#F8F7FF', fontSize: 13, fontWeight: '600' },
  headerSpacer: { width: 30 },
  eyebrow: { color: '#F4A9F0', fontSize: 8, letterSpacing: 1.8, fontWeight: '800', marginBottom: 9 },
  heading: { color: '#F7F7FF', fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  summary: { color: '#AAB8D4', fontSize: 9 },
  clearText: { color: '#F5B5F2', fontSize: 9, backgroundColor: 'rgba(222,114,220,0.18)', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  segment: { flexDirection: 'row', padding: 3, height: 38, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(153,176,218,0.15)', backgroundColor: 'rgba(18,39,82,0.55)', marginTop: 12, marginBottom: 24 },
  segmentButton: { flex: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segmentActive: { backgroundColor: '#ECA6E9', shadowColor: '#EC95E8', shadowOpacity: 0.32, shadowRadius: 9, elevation: 4 },
  segmentText: { color: '#AAB8D4', fontSize: 9 },
  segmentTextActive: { color: '#25163D', fontWeight: '700' },
  countBubble: { overflow: 'hidden', color: '#D5D9E8', fontSize: 8, minWidth: 15, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  countBubbleActive: { color: '#49315A', backgroundColor: 'rgba(68,40,84,0.12)' },
  sectionLabel: { color: '#A8B7D4', fontSize: 8, letterSpacing: 1.6, fontWeight: '700', marginBottom: 9 },
  featured: { height: 131, borderRadius: 15, overflow: 'hidden', marginBottom: 18, backgroundColor: '#18335F' },
  featuredImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined },
  featuredShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,15,37,0.05)', borderRadius: 15 },
  featuredHeart: { position: 'absolute', top: 10, right: 10, width: 25, height: 25, borderRadius: 14, backgroundColor: 'rgba(245,245,250,0.86)', alignItems: 'center', justifyContent: 'center' },
  featuredCopy: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 48, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(7,19,42,0.7)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuredTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  featuredMeta: { color: '#D0D7E4', fontSize: 8, marginTop: 2 },
  playButton: { width: 30, height: 30, borderRadius: 17, backgroundColor: '#F0A5E9', alignItems: 'center', justifyContent: 'center' },
  listHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 1 },
  sectionCount: { color: '#8294B5', fontSize: 8, marginBottom: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tileImageWrap: { height: 94, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1B345A' },
  tileImage: { width: '100%', height: '100%' },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,15,37,0.08)' },
  heartButton: { position: 'absolute', right: 7, top: 7, width: 22, height: 22, borderRadius: 12, backgroundColor: 'rgba(238,240,247,0.85)', alignItems: 'center', justifyContent: 'center' },
  duration: { position: 'absolute', bottom: 6, left: 7, flexDirection: 'row', alignItems: 'center', gap: 3 },
  durationText: { color: '#fff', fontSize: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 },
  tileTitle: { color: '#F4F6FC', fontSize: 9, fontWeight: '600', marginTop: 5 },
  empty: { alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  emptyIcon: { width: 48, height: 48, borderRadius: 25, backgroundColor: 'rgba(245,173,239,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyText: { color: '#AAB8D4', fontSize: 11, textAlign: 'center' },
});
