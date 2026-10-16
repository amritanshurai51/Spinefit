import React from 'react';
import { Text as NativeText, TextInput as NativeTextInput, StyleSheet } from 'react-native';
import type { StyleProp, TextInputProps, TextProps, TextStyle } from 'react-native';

const SORA_BY_WEIGHT: Record<string, string> = {
  '300': 'Sora_300Light',
  '400': 'Sora_400Regular',
  normal: 'Sora_400Regular',
  '500': 'Sora_500Medium',
  '600': 'Sora_600SemiBold',
  '700': 'Sora_700Bold',
  bold: 'Sora_700Bold',
  '800': 'Sora_800ExtraBold',
  '900': 'Sora_800ExtraBold',
};

function soraFont(style: StyleProp<TextStyle>) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  return SORA_BY_WEIGHT[String(weight ?? '400')] ?? 'Sora_400Regular';
}

export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[style, { fontFamily: soraFont(style) }]} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <NativeTextInput {...props} style={[style, { fontFamily: soraFont(style) }]} />;
}
