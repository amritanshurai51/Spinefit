import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { spineIconXml, spineLikeXml } from '../assets/svgMarkup';
import { useTheme } from '../theme/ThemeContext';

export default function PlansScreen({ navigation }: any) {
  const [sel, setSel] = React.useState<'yearly' | 'monthly'>('yearly');
  const { height } = useWindowDimensions();
  const { theme } = useTheme();
  const close = () => navigation.replace('Login');
  const ink = theme.dark ? '#F7F9FF' : '#153675';
  const muted = theme.dark ? '#BEC7E2' : '#596B96';
  const cardText = '#24324C';
  const mutedCardText = '#596B96';
  const radioBorder = '#D8CBE2';

  return (
    <Screen edges={['top', 'bottom']}>
      <SvgXml xml={spineLikeXml} width={250} height={394} style={[styles.spineArt, { top: 45, right: -5, opacity: theme.dark ? 0.34 : 1 }]} />
      <ScrollView contentContainerStyle={[styles.scrollContent, { minHeight: Math.max(580, height - 40) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SvgXml xml={spineIconXml} width={83} height={58} />
          <Pressable onPress={close} hitSlop={12} style={[styles.closeButton, { backgroundColor: theme.dark ? '#FFFFFF18' : '#FFFFFF88' }]}>
            <Ionicons name="close" size={17} color={ink} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: ink }]}>Care for your{ '\n' }spine, every day.</Text>

        <View style={{ height: Math.min(150, Math.max(112, height * 0.19)) }} />

        <View style={styles.plans}>
          <Pressable onPress={() => setSel('yearly')} style={[styles.planCard, styles.selectedPlanCard, sel === 'yearly' && styles.activePlanShadow, { backgroundColor: '#FFFFFF', borderColor: sel === 'yearly' ? '#E4B9EE' : '#EAE5ED' }]}>
            {sel === 'yearly' && <LinearGradient pointerEvents="none" colors={['#FFFFFF', '#F3DDF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activePlanGradient} />}
            <View style={[styles.radio, styles.selectedRadio, { borderColor: radioBorder, backgroundColor: sel === 'yearly' ? '#F2D8F4' : 'transparent' }]}>
              {sel === 'yearly' && <Ionicons name="checkmark" size={15} color="#153675" />}
            </View>
            <View style={styles.planDetails}>
              <Text style={[styles.planName, { color: cardText }]}>Yearly</Text>
              <Text style={[styles.planHint, { color: mutedCardText }]}>Just ₹333 a month</Text>
            </View>
            <View style={styles.priceBlock}>
              {sel === 'yearly' && <View style={styles.savingBadge}><Text style={styles.savingText}>Save 33%</Text></View>}
              <Text style={[styles.planPrice, { color: cardText }]}>₹3,999</Text>
              <Text style={[styles.pricePeriod, { color: mutedCardText }]}>per year</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setSel('monthly')} style={[styles.planCard, styles.selectedPlanCard, sel === 'monthly' && styles.activePlanShadow, { backgroundColor: '#FFFFFF', borderColor: sel === 'monthly' ? '#E4B9EE' : '#EAE5ED' }]}>
            {sel === 'monthly' && <LinearGradient pointerEvents="none" colors={['#FFFFFF', '#F3DDF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.activePlanGradient} />}
            <View style={[styles.radio, styles.selectedRadio, { borderColor: radioBorder, backgroundColor: sel === 'monthly' ? '#F2D8F4' : 'transparent' }]}>
              {sel === 'monthly' && <Ionicons name="checkmark" size={15} color="#153675" />}
            </View>
            <View style={styles.planDetails}>
              <Text style={[styles.planName, { color: cardText }]}>Monthly</Text>
              <Text style={[styles.planHint, { color: mutedCardText }]}>Switch or cancel anytime</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={[styles.planPrice, { color: cardText }]}>₹499</Text>
              <Text style={[styles.pricePeriod, { color: mutedCardText }]}>per month</Text>
            </View>
          </Pressable>
        </View>

        <Pressable onPress={close} style={styles.ctaWrap}>
          <LinearGradient colors={theme.dark ? ['#173E84', '#123775'] : ['#173C7A', '#123675']} style={styles.cta}>
            <Text style={styles.ctaText}>Start 7-day free trial</Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.renewal}>Then {sel === 'yearly' ? '₹3,999 per year' : '₹499 per month'}. Cancel anytime.</Text>

        <View style={styles.footerSpacer} />
        <View style={styles.footerLinks}>
          <Pressable onPress={() => Alert.alert('Restore purchase', 'Purchase restoration will be available when billing is connected.')}><Text style={styles.footerLink}>Restore purchase</Text></Pressable>
          <Pressable onPress={() => Alert.alert('Terms', 'Terms of service will be available soon.')}><Text style={styles.footerLink}>Terms</Text></Pressable>
          <Pressable onPress={() => Alert.alert('Privacy', 'Privacy policy will be available soon.')}><Text style={styles.footerLink}>Privacy</Text></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 3, paddingBottom: 13 },
  spineArt: { position: 'absolute' },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, lineHeight: 31, fontWeight: '700', letterSpacing: -0.65, marginTop: 30 },
  plans: { gap: 14 },
  planCard: { minHeight: 76, borderRadius: 19, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 13, shadowColor: '#0B2F7A', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  selectedPlanCard: { minHeight: 86 },
  activePlanShadow: { shadowColor: '#4C1D95', shadowOpacity: 0.38, shadowRadius: 18, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  activePlanGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 18 },
  radio: { width: 22, height: 22, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  selectedRadio: { width: 22, height: 22, borderRadius: 12 },
  planDetails: { flex: 1 },
  planName: { fontSize: 17, fontWeight: '700' },
  planHint: { fontSize: 11, marginTop: 4 },
  priceBlock: { minWidth: 80, alignItems: 'flex-end', paddingTop: 5 },
  planPrice: { fontSize: 19, fontWeight: '800' },
  pricePeriod: { fontSize: 10, marginTop: 3 },
  savingBadge: { position: 'absolute', right: 0, top: -28, backgroundColor: '#F1C9F2', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 3 },
  savingText: { color: '#342246', fontSize: 9, fontWeight: '700' },
  ctaWrap: { marginHorizontal: 4, marginTop: 42, shadowColor: '#273B7C', shadowOpacity: 0.16, shadowRadius: 10, elevation: 4 },
  cta: { height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  renewal: { color: '#282328', fontSize: 10, textAlign: 'center', marginTop: 58 },
  footerSpacer: { flex: 1, minHeight: 38 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 19, paddingBottom: 4 },
  footerLink: { color: '#282328', fontSize: 10, textDecorationLine: 'underline' },
});
