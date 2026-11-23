import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Text } from './Typography';

type Props = {
  visible: boolean;
  title: string;
  html: string;
  onClose: () => void;
};

export function LegalDocumentModal({ visible, title, html, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#080D2480', justifyContent: 'flex-end' }}>
        <View style={{ height: '92%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
          <View style={{ minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E8EAF1' }}>
            <Text numberOfLines={1} style={{ color: '#14306B', fontSize: 16, fontWeight: '800', flex: 1, marginRight: 12 }}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close legal document" hitSlop={10} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1EFF7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={21} color="#14306B" />
            </Pressable>
          </View>
          <WebView source={{ html }} originWhitelist={['*']} style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
        </View>
      </View>
    </Modal>
  );
}
