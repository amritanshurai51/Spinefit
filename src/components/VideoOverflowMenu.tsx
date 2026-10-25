import React from 'react';
import { Alert, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { HomeVideo } from '../api/endpoints';
import { useTheme } from '../theme/ThemeContext';

const QUEUE_STORAGE_KEY = 'spinefit_video_queue';

export default function VideoOverflowMenu({ video }: { video: HomeVideo }) {
  const { theme } = useTheme();

  const addToQueue = async () => {
    try {
      const savedQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      const queue: HomeVideo[] = savedQueue ? JSON.parse(savedQueue) : [];
      if (!queue.some(item => item.video_id === video.video_id)) {
        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify([...queue, video]));
      }
      Alert.alert('Added to queue', `${video.title} is in your video queue.`);
    } catch {
      Alert.alert('Could not add to queue', 'Please try again.');
    }
  };

  const showActions = () => Alert.alert(video.title, 'Choose an action', [
    { text: 'Add to queue', onPress: () => { void addToQueue(); } },
    {
      text: 'Download',
      onPress: () => Alert.alert('Download unavailable', 'This video is currently provided as a streaming playlist. Offline downloads are not configured yet.'),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`More options for ${video.title}`}
      hitSlop={8}
      onPress={event => {
        event.stopPropagation();
        showActions();
      }}
      style={{ width: 30, height: 28, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name="ellipsis-vertical" size={18} color={theme.subtext} />
    </Pressable>
  );
}
