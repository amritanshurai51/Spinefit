import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { Text } from '../components/Typography';
import { Button, Input, Logo, Screen } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { friendlyAuthError } from '../api/firebase';
import { googleIconXml } from '../assets/googleIconXml';

export default function LoginScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [remember, setRemember] = useState(true); const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const submit = async () => {
    if (!email || !pw) return Alert.alert('Enter email and password');
    setBusy(true);
    try { await login(email.trim(), pw); }
    catch (e: any) { Alert.alert('Login failed', friendlyAuthError(e)); }
    finally { setBusy(false); }
  };
  const signInGoogle = async () => {
    setGoogleBusy(true);
    try { await loginWithGoogle(); }
    catch (error: any) { Alert.alert('Google sign-in failed', googleErrorMessage(error)); }
    finally { setGoogleBusy(false); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 21, paddingTop: 28, paddingBottom: 22, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignSelf: 'flex-start' }}><Logo size={50} /></View>
          <Text style={{ fontSize: 32, lineHeight: 34, fontWeight: '800', color: '#103477', marginTop: 13 }}>Welcome back</Text>
          <Text style={{ color: '#173970', fontSize: 13, marginTop: 2, marginBottom: 20 }}>Good to have you back</Text>

          <Text style={{ color: '#103477', fontSize: 12, fontWeight: '600', marginBottom: 7 }}>Email</Text>
          <Input icon="mail-outline" placeholder="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} containerStyle={fieldStyle} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -1, marginBottom: 7 }}>
            <Text style={{ color: '#103477', fontSize: 12, fontWeight: '600' }}>Password</Text>
            <Text onPress={() => navigation.navigate('ForgotPassword')} style={{ color: '#103477', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>Forgot?</Text>
          </View>
          <Input icon="lock-closed-outline" placeholder="Password" secure value={pw} onChangeText={setPw} containerStyle={fieldStyle} />
          <Pressable onPress={() => setRemember(!remember)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1, marginBottom: 24 }}>
            <View style={{ width: 17, height: 17, borderRadius: 5, backgroundColor: remember ? '#123D86' : 'transparent', borderWidth: 1, borderColor: '#123D86', alignItems: 'center', justifyContent: 'center' }}>
              {remember && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={{ color: '#536183', fontSize: 12, marginLeft: 10 }}>Keep me logged in on this device.</Text>
          </Pressable>
          <Button title="Log in" onPress={submit} loading={busy} style={{ height: 50, borderRadius: 17, backgroundColor: '#103F8E', shadowColor: '#102D6C', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 5 }} />
          <Text style={{ textAlign: 'center', fontSize: 12, color: '#465476', marginTop: 17, marginBottom: 15 }}>or continue with</Text>
          <SocialButton title="Continue with Google" customIcon={<SvgXml xml={googleIconXml} width={18} height={18} />} onPress={signInGoogle} disabled={googleBusy} />
          <SocialButton title="Continue with Apple" icon="logo-apple" dark />
          <Text style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 28, fontSize: 11, color: '#465476' }}>
            New to SpineFit? <Text onPress={() => navigation.navigate('Signup')} style={{ color: '#103477', fontWeight: '700' }}>Create an account</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const fieldStyle = { height: 50, borderRadius: 15, borderColor: 'rgba(255,255,255,0.98)', backgroundColor: '#FFFFFF', marginBottom: 14, shadowColor: '#4C1D95', shadowOpacity: 0.38, shadowRadius: 13, shadowOffset: { width: 0, height: 9 }, elevation: 7 } as const;
function googleErrorMessage(error: any) {
  const message = String(error?.message ?? '');
  const code = String(error?.code ?? '');
  if (message.includes('RNGoogleSignin') && message.includes('could not be found')) {
    return 'This app binary does not include Google Sign-In. Open the SpineFit development build; Expo Go does not include this native module.';
  }
  if (code === 'DEVELOPER_ERROR' || code === '10') {
    return 'Google sign-in setup failed (DEVELOPER_ERROR). Verify the Android package name, signing SHA-1, and Firebase Google client settings.';
  }
  if (code.includes('PLAY_SERVICES_NOT_AVAILABLE')) return 'Google Play services are unavailable or need an update on this phone.';
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'Could not reach the SpineFit server. Check your internet connection and try again.';
  }
  return message || 'Google sign-in failed. Please try again.';
}

function SocialButton({ title, icon, customIcon, dark = false, onPress, disabled = false }: { title: string; icon?: any; customIcon?: React.ReactNode; dark?: boolean; onPress?: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress ?? (() => Alert.alert('Not set up yet', 'Social sign-in has not been configured for this app.'))} style={{ height: 56, marginBottom: 9, borderRadius: 17, borderWidth: dark ? 0 : 1, borderColor: 'rgba(50,42,78,0.18)', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.65 : 1 }}>
    {customIcon ?? <Ionicons name={icon} size={16} color={dark ? '#111' : '#4285F4'} />}<Text style={{ color: '#101010', fontSize: 13,fontWeight: '500', marginLeft: 8 }}>{title}</Text>
  </Pressable>;
}
