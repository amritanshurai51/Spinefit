import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Typography';
import { Button, Input, Logo, Screen } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { friendlyAuthError } from '../api/firebase';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!email) return Alert.alert('Enter your registered email');
    setBusy(true);
    try { await resetPassword(email.trim()); Alert.alert('Check your inbox', 'We sent you a reset link.', [{ text: 'OK', onPress: () => navigation.goBack() }]); }
    catch (e: any) { Alert.alert('Could not send link', friendlyAuthError(e)); }
    finally { setBusy(false); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 7, paddingBottom: 15 }}>
        <View style={{ height: 42, justifyContent: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={16} color="#fff" /></Pressable>
          <View style={{ position: 'absolute', alignSelf: 'center' }}><Logo size={38} /></View>
        </View>
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <View style={{ width: 66, height: 66, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.85)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}><Ionicons name="lock-closed-outline" size={25} color="#103477" /></View>
          <Text style={{ color: '#090A12', fontSize: 23, fontWeight: '700', textAlign: 'center' }}>Reset Password</Text>
          <Text style={{ color: '#17141C', fontSize: 12, textAlign: 'center', lineHeight: 19, marginTop: 5, marginBottom: 18, paddingHorizontal: 12 }}>Create a new password and get back to your wellness journey.</Text>
        </View>
        <Text style={{ color: '#103477', fontSize: 10, fontWeight: '600', marginBottom: 7 }}>Email</Text>
        <Input icon="mail-outline" placeholder="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} containerStyle={fieldStyle} />
        <Button title="Send Reset Link" onPress={submit} loading={busy} style={{ height: 50, borderRadius: 16, backgroundColor: '#103F8E', marginTop: 13 }} />
        <Text style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 30, fontSize: 10, color: '#47434D' }}>Remember your password? <Text onPress={() => navigation.goBack()} style={{ color: '#103477', fontWeight: '700' }}>Sign In</Text></Text>
      </View>
    </Screen>
  );
}

const fieldStyle = { height: 46, borderRadius: 15, borderColor: 'rgba(255,255,255,0.95)', backgroundColor: 'rgba(255,255,255,0.56)', marginBottom: 14, shadowColor: '#48327D', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 3 } as const;
