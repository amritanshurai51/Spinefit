import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Typography';
import { Button, Input, Logo, Screen } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { friendlyAuthError } from '../api/firebase';
import { LegalDocumentModal } from '../components/LegalDocumentModal';
import { legalDocuments } from '../assets/legalDocuments';

export default function SignupScreen({ navigation }: any) {
  const { register } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [agree, setAgree] = useState(false); const [busy, setBusy] = useState(false);
  const [legalDocument, setLegalDocument] = useState<'privacyPolicy' | 'termsOfService' | 'userAgreement' | null>(null);
  const submit = async () => {
    if (!name.trim()) return Alert.alert('Please enter your name.');
    if (!email.trim() || pw.length < 6) return Alert.alert('Please enter your email and a password of at least 6 characters');
    if (!agree) return Alert.alert('Please accept the Terms of Service and Privacy Policy.');
    setBusy(true);
    try { await register(name.trim(), email.trim(), pw); }
    catch (e: any) { Alert.alert('Sign up failed', friendlyAuthError(e)); }
    finally { setBusy(false); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 7, paddingBottom: 22, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ height: 42, justifyContent: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={16} color="#000" />
          </Pressable>
          <View style={{ position: 'absolute', alignSelf: 'center' }}><Logo size={40} /></View>
        </View>
        <Text style={{ color: '#080A12', fontSize: 28, lineHeight: 31, fontWeight: '700', marginTop: 27 }}>Create your account</Text>
        <Text style={{ color: '#14121A', fontSize: 14, marginBottom: 9 }}>Your journey to better spine health starts here.</Text>

        <Text style={label}>Name</Text>
        <Input icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} containerStyle={fieldStyle} />
        <Text style={label}>Email</Text>
        <Input icon="mail-outline" placeholder="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} containerStyle={fieldStyle} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 1, marginBottom: 7 }}><Text style={label}>Password</Text><Text onPress={() => navigation.navigate('ForgotPassword')} style={{ ...label, textDecorationLine: 'underline' }}>Forgot?</Text></View>
        <Input icon="lock-closed-outline" placeholder="Create a password" secure value={pw} onChangeText={setPw} containerStyle={{ ...fieldStyle, marginBottom: 13 }} />
        <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
          <View style={{ height: 4, flex: 1, backgroundColor: pw.length >= 6 ? '#123D86' : '#B7A4CC', borderRadius: 4 }} />
          <View style={{ height: 4, flex: 1, backgroundColor: pw.length >= 10 ? '#123D86' : '#B7A4CC', borderRadius: 4 }} />
        </View>
        <Text style={{ color: '#68779B', fontSize: 12, marginBottom: 19, marginLeft: 6 }}>{pw.length >= 10 ? 'Strong password — nice work.' : pw.length >= 6 ? 'Good — add a symbol to make it strong.' : 'Use at least 6 characters for your password.'}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Pressable onPress={() => setAgree(!agree)} accessibilityRole="checkbox" accessibilityState={{ checked: agree }} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: agree ? '#123D86' : 'transparent', borderColor: '#123D86', borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>{agree && <Ionicons name="checkmark" size={13} color="#fff" />}</View>
          <Text style={{ color: '#697597', fontSize: 12, marginLeft: 10, flex: 1 }}>I agree to the Terms of Service, Privacy Policy, and User Agreement.</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: -12, marginBottom: 16, marginLeft: 26 }}>
          <Text onPress={() => setLegalDocument('termsOfService')} style={legalLink}>Terms of Service</Text>
          <Text style={legalLinkSeparator}>, </Text>
          <Text onPress={() => setLegalDocument('privacyPolicy')} style={legalLink}>Privacy Policy</Text>
          <Text style={legalLinkSeparator}> and </Text>
          <Text onPress={() => setLegalDocument('userAgreement')} style={legalLink}>User Agreement</Text>
        </View>
        <Button title="Create Account" onPress={submit} loading={busy} style={{ height: 50, borderRadius: 16, backgroundColor: '#103F8E' }} />
        <Text style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 30, fontSize: 12, color: '#47434D' }}>
          Already have an account? <Text onPress={() => navigation.goBack()} style={{ color: '#103477', fontWeight: '700' }}>Sign In</Text>
        </Text>
      </ScrollView>
      {legalDocument && (
        <LegalDocumentModal
          visible
          title={legalDocument === 'privacyPolicy' ? 'Privacy Policy' : legalDocument === 'termsOfService' ? 'Terms of Service' : 'User Agreement'}
          html={legalDocuments[legalDocument]}
          onClose={() => setLegalDocument(null)}
        />
      )}
    </Screen>
  );
}

const label = { color: '#103477', fontSize: 12, fontWeight: '600' as const, marginBottom: 7 };
const legalLink = { color: '#103477', fontSize: 12, fontWeight: '700' as const, textDecorationLine: 'underline' as const };
const legalLinkSeparator = { color: '#697597', fontSize: 12 };
const fieldStyle = { height: 50, borderRadius: 15, borderColor: 'rgba(255,255,255,0.98)', backgroundColor: '#FFFFFF', marginBottom: 14, shadowColor: '#4C1D95', shadowOpacity: 0.38, shadowRadius: 13, shadowOffset: { width: 0, height: 9 }, elevation: 7 } as const;
