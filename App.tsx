import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, Sora_300Light, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider } from './src/store/AuthContext';
import { ContentProvider } from './src/store/ContentContext';
import { FavouritesProvider } from './src/store/FavouritesContext';
import { WaterIntakeProvider } from './src/store/useWaterIntake';
import RootNavigator from './src/navigation/RootNavigator';
import { registerForNotifications } from './src/services/notifications';

function Inner() {
  const { theme } = useTheme();
  // Push token registration can fail in Expo Go or before an EAS project ID is
  // configured. Keep that optional setup from turning app startup into an
  // unhandled promise rejection on the device.
  useEffect(() => {
    registerForNotifications().catch(error => {
      console.warn('Notification registration failed:', error);
    });
  }, []);
  return (<><StatusBar style={theme.dark ? 'light' : 'dark'} /><RootNavigator /></>);
}
export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_300Light,
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  if (!fontsLoaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;

  return (
    <SafeAreaProvider><ThemeProvider><AuthProvider><WaterIntakeProvider><ContentProvider><FavouritesProvider><Inner /></FavouritesProvider></ContentProvider></WaterIntakeProvider></AuthProvider></ThemeProvider></SafeAreaProvider>
  );
}
