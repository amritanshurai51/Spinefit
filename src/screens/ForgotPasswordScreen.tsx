import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Text } from '../components/Typography';
import { Button, Input, Screen } from '../components/ui';
import { AuthApi } from '../api/endpoints';
import { useTheme } from '../theme/ThemeContext';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!email) return Alert.alert('Enter your registered email');
    setBusy(true);
    try { await AuthApi.forgot(email.trim()); Alert.alert('Check your inbox', 'We sent you a reset link.', [{ text: 'OK', onPress: () => navigation.goBack() }]); }
    catch { Alert.alert('Could not send link', 'Please try again later.'); }
    setBusy(false);
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ padding: 24, marginTop: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text }}>Forgot password?</Text>
        <Text style={{ color: theme.subtext, marginBottom: 24 }}>Enter your email and we'll send a reset link.</Text>
        <Input icon="mail-outline" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Button title="Send reset link" onPress={submit} loading={busy} />
      </View>
    </Screen>
  );
}
