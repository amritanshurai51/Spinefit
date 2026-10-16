import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInputProps, View, ViewStyle } from 'react-native';
import { Text, TextInput } from './Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { spineIconXml } from '../assets/svgMarkup';

export const Screen = ({ children, style, edges = ['top'] }: { children: React.ReactNode; style?: ViewStyle; edges?: any }) => {
  const { theme } = useTheme();
  return (
    <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
      <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>{children}</SafeAreaView>
    </LinearGradient>
  );
};

export const Logo = ({ size = 96 }: { size?: number }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: size }}>
      <SvgXml xml={spineIconXml} width={size * 1.38} height={size} />
    </View>
  );
};

export const Button = ({ title, onPress, loading, variant = 'solid', style }: any) => {
  const { theme } = useTheme();
  const solid = variant === 'solid';
  return (
    <Pressable onPress={onPress} disabled={loading}
      style={[s.btn, { backgroundColor: solid ? theme.primary : 'transparent', borderColor: theme.primary, borderWidth: solid ? 0 : 1.5 }, style]}>
      {loading ? <ActivityIndicator color={solid ? theme.chipActiveText : theme.primary} /> :
        <Text style={{ color: solid ? theme.chipActiveText : theme.primary, fontWeight: '700', fontSize: 16 }}>{title}</Text>}
    </Pressable>
  );
};

export const Input = ({ icon, secure, ...p }: TextInputProps & { icon?: any; secure?: boolean }) => {
  const { theme } = useTheme();
  const [hide, setHide] = React.useState(!!secure);
  return (
    <View style={[s.input, { backgroundColor: theme.input, borderColor: theme.border }]}>
      {icon && <Ionicons name={icon} size={20} color={theme.text} />}
      <TextInput {...p} secureTextEntry={hide} placeholderTextColor={theme.subtext} autoCapitalize="none"
        style={{ flex: 1, marginHorizontal: 10, color: theme.text, fontSize: 15 }} />
      {secure && <Ionicons name={hide ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.text} onPress={() => setHide(!hide)} />}
    </View>
  );
};
const s = StyleSheet.create({
  btn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  input: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, marginBottom: 14 },
});
