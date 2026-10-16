import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/Typography';
import { Button, Logo, Screen } from '../components/ui';
import { useTheme } from '../theme/ThemeContext';

export default function WelcomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center' }}><Logo size={120} /></View>
      <View style={{ padding: 24 }}>
        <Button title="Get Started" onPress={() => navigation.navigate('Plans')} />
        <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: theme.subtext }}>
          Already member ? <Text onPress={() => navigation.navigate('Login')} style={{ color: theme.text, fontWeight: '700' }}>Login</Text>
        </Text>
      </View>
    </Screen>
  );
}
