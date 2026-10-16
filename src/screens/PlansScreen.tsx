import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { Text } from '../components/Typography';
import { Screen } from '../components/ui';
import { spineIconXml, spineLikeXml } from '../assets/svgMarkup';

const BENEFITS = [
  { icon: 'calendar-outline' as const, text: 'Priority booking at partner centres' },
  { icon: 'pulse-outline' as const, text: 'Posture and pain tracking' },
  { icon: 'play-circle-outline' as const, text: 'Physio-designed exercise programs' },
  { icon: 'pricetag-outline' as const, text: 'Member pricing on support products' },
];

export default function PlansScreen({ navigation }: any) {
  const [sel, setSel] = React.useState('yearly');
  const { height } = useWindowDimensions();
  const close = () => navigation.replace('Login');
  const chosenPrice = sel === 'yearly' ? '₹3,999' : '₹499';

  return (
    <Screen edges={['top', 'bottom']} style={styles.screen}>
      <SvgXml xml={spineLikeXml} width={250} height={425} style={[styles.spineArt, { top: Math.max(48, height * 0.07) }]} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <SvgXml xml={spineIconXml} width={69} height={50} />
          <Pressable onPress={close} hitSlop={12} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#E8F0FF" />
          </Pressable>
        </View>

        <Text style={styles.title}>Care for your{ '\n' }spine, every day.</Text>
        <Text style={styles.subtitle}>Specialist guidance, guided exercise and{ '\n' }everyday support in one plan.</Text>

        <View style={styles.benefits}>
          {BENEFITS.map(item => (
            <View key={item.text} style={styles.benefitRow}>
              <View style={styles.benefitIcon}><Ionicons name={item.icon} size={15} color="#E9B3F0" /></View>
              <Text style={styles.benefitText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <Pressable onPress={() => setSel('yearly')} style={[styles.planCard, styles.yearlyCard, sel === 'yearly' && styles.selectedCard]}>
            {sel === 'yearly' && <View style={styles.savingBadge}><Text style={styles.savingText}>Save 33%</Text></View>}
            <View style={[styles.radio, sel === 'yearly' && styles.radioSelected]}>
              {sel === 'yearly' && <Ionicons name="checkmark" size={13} color="#763C83" />}
            </View>
            <View style={styles.planDetails}>
              <Text style={[styles.planName, sel === 'yearly' && styles.planNameSelected]}>Yearly</Text>
              <Text style={[styles.planHint, sel === 'yearly' && styles.planHintSelected]}>Just ₹333 a month</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={[styles.planPrice, sel === 'yearly' && styles.planPriceSelected]}>₹3,999</Text>
              <Text style={[styles.pricePeriod, sel === 'yearly' && styles.pricePeriodSelected]}>per year</Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setSel('monthly')} style={[styles.planCard, styles.monthlyCard, sel === 'monthly' && styles.selectedCard]}>
            <View style={[styles.radio, sel === 'monthly' && styles.radioSelected]}>
              {sel === 'monthly' && <Ionicons name="checkmark" size={13} color="#763C83" />}
            </View>
            <View style={styles.planDetails}>
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planHint}>Switch or cancel anytime</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.planPrice}>₹499</Text>
              <Text style={styles.pricePeriod}>per month</Text>
            </View>
          </Pressable>
        </View>

        <Pressable onPress={close} style={styles.ctaWrap}>
          <LinearGradient colors={['#F4D1F4', '#E7B7EE']} style={styles.cta}>
            <Text style={styles.ctaText}>Start 7-day free trial</Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.renewal}>Then {chosenPrice} per {sel === 'yearly' ? 'year' : 'month'}. Cancel anytime.</Text>

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
  screen: { backgroundColor: '#071A3B' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10 },
  spineArt: { position: 'absolute', right: -42, opacity: 0.63 },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  closeButton: { width: 31, height: 31, borderRadius: 17, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F7F9FF', fontSize: 27, lineHeight: 31, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: '#B9C9E0', fontSize: 12, lineHeight: 18, marginTop: 10 },
  benefits: { gap: 10, marginTop: 18, marginBottom: 19 },
  benefitRow: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 11 },
  benefitIcon: { width: 29, height: 29, borderRadius: 9, backgroundColor: 'rgba(183,179,244,0.15)', borderColor: 'rgba(196,193,248,0.25)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: '#EDF2FF', fontSize: 11, fontWeight: '500' },
  plans: { gap: 10, marginTop: 1 },
  planCard: { minHeight: 68, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(177,197,231,0.23)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  yearlyCard: { backgroundColor: 'rgba(242,248,246,0.97)' },
  monthlyCard: { backgroundColor: 'rgba(28,52,91,0.76)' },
  selectedCard: { borderColor: '#F0C0F0', shadowColor: '#E9A6E7', shadowOpacity: 0.32, shadowRadius: 12, elevation: 5 },
  savingBadge: { position: 'absolute', right: 13, top: -10, backgroundColor: '#F1C7F2', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  savingText: { color: '#342246', fontSize: 8, fontWeight: '700' },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(220,231,250,0.65)', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderWidth: 0, backgroundColor: '#F0C8F0' },
  planDetails: { flex: 1 },
  planName: { color: '#F3F6FF', fontSize: 15, fontWeight: '700' },
  planNameSelected: { color: '#153061' },
  planHint: { color: '#A9B9D3', fontSize: 10, marginTop: 4 },
  planHintSelected: { color: '#5D626B' },
  priceBlock: { alignItems: 'flex-end' },
  planPrice: { color: '#F4F7FF', fontSize: 18, fontWeight: '800' },
  planPriceSelected: { color: '#102B55' },
  pricePeriod: { color: '#A9B9D3', fontSize: 9, marginTop: 3 },
  pricePeriodSelected: { color: '#5D626B' },
  ctaWrap: { marginHorizontal: 6, marginTop: 17, shadowColor: '#EFADEB', shadowOpacity: 0.28, shadowRadius: 14, elevation: 5 },
  cta: { height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#172541', fontWeight: '700', fontSize: 14 },
  renewal: { color: '#AABBD6', fontSize: 9, textAlign: 'center', marginTop: 9 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: 19, marginTop: 'auto', paddingTop: 29 },
  footerLink: { color: '#9EAFCA', fontSize: 9, textDecorationLine: 'underline' },
});
