import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/Typography';
import { Button, Logo, Screen } from '../components/ui';
import { useTheme } from '../theme/ThemeContext';

export default function WelcomeScreen({ navigation }: any) {
  const { theme } = useTheme();

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: 22 }}>
        <View style={{ alignItems: 'center', paddingTop: 42 }}>
          <Logo size={100} />
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <Text style={{ color: theme.text, fontSize: 27, lineHeight: 31, fontWeight: '700', textAlign: 'center', letterSpacing: -0.7 }}>
            Move better{ '\n' }with specialist-{ '\n' }led spine care.
          </Text>
          <Text style={{ color: theme.subtext, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 }}>
            Consultations, guided recovery and{ '\n' }trusted support products, in one place.
          </Text>
          <Button
            title="Get started"
            onPress={() => navigation.navigate('Plans')}
            style={{ width: '100%', height: 51, borderRadius: 16, marginTop: 11, backgroundColor: theme.primary }}
          />
          <Text style={{ textAlign: 'center', marginTop: 11, fontSize: 12, color: theme.subtext }}>
            Already a member?{' '}
            <Text onPress={() => navigation.navigate('Login')} style={{ color: theme.text, fontWeight: '700' }}>
              Log in
            </Text>
          </Text>
        </View>
      </View>
    </Screen>
  );
}
