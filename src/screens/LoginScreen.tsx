import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Text } from '../components/Typography';
import { Button, Input, Logo, Screen } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../theme/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { login, devBypass } = useAuth();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!email || !pw) return Alert.alert('Enter email and password');
    setBusy(true);
    try { await login(email.trim(), pw); }
    catch (e: any) { Alert.alert('Login failed', e?.response?.data?.message ?? 'Please check your details and try again.'); }
    setBusy(false);
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <Logo size={72} />
          <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, marginTop: 28 }}>Welcome back</Text>
          <Text style={{ color: theme.subtext, marginBottom: 24 }}>Login to continue your journey</Text>
          <Input icon="mail-outline" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input icon="lock-closed-outline" placeholder="Password" secure value={pw} onChangeText={setPw} />
          <Text onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', color: theme.text, fontWeight: '600', marginBottom: 20 }}>
            Forgot email or password?
          </Text>
          <Button title="Login" onPress={submit} loading={busy} />
          <Button title="Create account" variant="outline" style={{ marginTop: 12 }} onPress={() => navigation.navigate('Signup')} />
          {/* {__DEV__ && <Text onPress={devBypass} style={{ textAlign: 'center', marginTop: 24, color: theme.subtext }}>[dev] Skip login</Text>} */}
          {true && <Text onPress={devBypass} style={{ textAlign: 'center', marginTop: 24, color: theme.subtext }}>[dev] Skip login</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
