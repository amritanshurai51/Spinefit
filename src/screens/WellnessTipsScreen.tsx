import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Api } from '../api/endpoints';
import type { ApiError } from '../api/client';
import type { WellnessTipFile } from '../api/endpoints';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { useTheme } from '../theme/ThemeContext';

export default function WellnessTipsScreen() {
  const { theme } = useTheme();
  const [tips, setTips] = useState<WellnessTipFile[]>([]);
  const [linksExpireAt, setLinksExpireAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingTip, setOpeningTip] = useState<string | null>(null);

  const loadTips = useCallback(async () => {
    setError('');
    try {
      const result = await Api.wellnessTips();
      setTips(result.tips ?? []);
      setLinksExpireAt(result.links_expire_at ?? 0);
      return result.tips ?? [];
    } catch (cause) {
      const apiError = cause as ApiError;
      setError(apiError.detail ?? 'Could not load wellness tips. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTips(); }, [loadTips]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && linksExpireAt > 0 && Date.now() / 1000 >= linksExpireAt) void loadTips();
    });
    return () => subscription.remove();
  }, [linksExpireAt, loadTips]);

  const openTip = async (tip: WellnessTipFile) => {
    setOpeningTip(tip.tip_id);
    try {
      let selected = tip;
      if (!linksExpireAt || Date.now() / 1000 >= linksExpireAt) {
        const refreshed = await loadTips();
        const freshTip = refreshed?.find(item => item.tip_id === tip.tip_id);
        if (!freshTip) throw new Error('This tip is no longer available.');
        selected = freshTip;
      }
      await Linking.openURL(selected.pdf_url);
    } catch (cause: any) {
      setError(cause?.message ?? 'Could not open this wellness tip. Please try again.');
    } finally {
      setOpeningTip(null);
    }
  };

  const cardBackground = theme.dark ? '#17235C' : '#FFFFFF';
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={{ color: theme.text, fontSize: 25, fontWeight: '800' }}>Wellness Tips</Text>
          <Text style={{ color: theme.subtext, fontSize: 13, marginTop: 5 }}>Practical guidance for a healthier spine</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 56 }} /> : null}
        {error ? <View style={[styles.message, { backgroundColor: cardBackground, borderColor: theme.border }]}>
          <Ionicons name="cloud-offline-outline" size={28} color={theme.primary} />
          <Text style={{ color: theme.text, fontSize: 14, textAlign: 'center', marginTop: 10 }}>{error}</Text>
          <Pressable onPress={() => { setLoading(true); void loadTips(); }} style={[styles.retry, { backgroundColor: theme.primary }]}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Try again</Text></Pressable>
        </View> : null}
        {!loading && !error && tips.length === 0 ? <View style={[styles.message, { backgroundColor: cardBackground, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.dark ? '#253775' : '#FCEFFC' }]}><Ionicons name="leaf-outline" size={31} color={theme.primary} /></View>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 13 }}>No tips yet</Text>
          <Text style={{ color: theme.subtext, fontSize: 13, textAlign: 'center', marginTop: 6 }}>New wellness tips will appear here when they are available.</Text>
        </View> : null}

        {tips.map(tip => <Pressable key={tip.tip_id} onPress={() => void openTip(tip)} style={[styles.tipCard, { backgroundColor: cardBackground, borderColor: theme.border }]}>
          <View style={styles.thumbnailWrap}>
            <Image source={{ uri: tip.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(12,31,75,0.68)']} style={StyleSheet.absoluteFill} />
            <View style={styles.pdfPill}><Ionicons name="document-text-outline" size={13} color="#fff" /><Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>PDF · {tip.page_count} pages</Text></View>
            {openingTip === tip.tip_id ? <View style={styles.opening}><ActivityIndicator color="#fff" /></View> : null}
          </View>
          <View style={styles.tipInfo}>
            <Text numberOfLines={2} style={{ color: theme.text, fontSize: 16, lineHeight: 23, fontWeight: '700', flex: 1 }}>{tip.title}</Text>
            <Ionicons name="arrow-forward-circle" size={27} color={theme.primary} style={{ marginLeft: 8 }} />
          </View>
          <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 4 }}>{formatFileSize(tip.file_size)} · {new Date(tip.created_at).toLocaleDateString()}</Text>
        </Pressable>)}
      </ScrollView>
    </Screen>
  );
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  heading: { marginBottom: 20 },
  tipCard: { borderWidth: 1, borderRadius: 20, padding: 10, marginBottom: 16, shadowColor: '#12316B', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 3 },
  thumbnailWrap: { width: '100%', aspectRatio: 720 / 509, borderRadius: 14, overflow: 'hidden', backgroundColor: '#DDE8F8' },
  thumbnail: { width: '100%', height: '100%' },
  pdfPill: { position: 'absolute', bottom: 11, left: 11, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(12,31,75,0.72)' },
  opening: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(12,31,75,0.35)' },
  tipInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  message: { minHeight: 190, padding: 24, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18, marginTop: 14 },
});
