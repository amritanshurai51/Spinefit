import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Text } from '../components/Typography';
import { Button, Input, Screen } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../theme/ThemeContext';

export default function SignupScreen({ navigation }: any) {
  const { theme } = useTheme(); const { register } = useAuth();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name || !email || pw.length < 6) return Alert.alert('Please fill all fields (password min 6 characters)');
    setBusy(true);
    try { await register(name.trim(), email.trim(), pw); }
    catch (e: any) { Alert.alert('Sign up failed', e?.response?.data?.message ?? 'Please try again.'); }
    setBusy(false);
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, marginTop: 40 }}>Create account</Text>
        <Text style={{ color: theme.subtext, marginBottom: 24 }}>Start your spine-care journey</Text>
        <Input icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Input icon="mail-outline" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input icon="lock-closed-outline" placeholder="Password" secure value={pw} onChangeText={setPw} />
        <Button title="Create" onPress={submit} loading={busy} style={{ marginTop: 8 }} />
        <Text style={{ textAlign: 'center', marginTop: 16, color: theme.subtext }}>
          Already a member? <Text onPress={() => navigation.goBack()} style={{ color: theme.text, fontWeight: '700' }}>Login</Text>
        </Text>
      </ScrollView>
    </Screen>
  );
}
