import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { Text } from '../components/Typography';
import { wellnessIconXml } from '../assets/wellnessIconXml';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import WelcomeScreen from '../screens/WelcomeScreen';
import PlansScreen from '../screens/PlansScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import WellnessTipsScreen from '../screens/WellnessTipsScreen';
import TrackerScreen from '../screens/TrackerScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import WaterIntakeScreen from '../screens/WaterIntakeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const icons: Record<string, any> = { Home: 'home-outline', Tracker: 'pulse', Favourite: 'heart-outline', Profile: 'person-outline' };
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false, tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 0, height: 64, paddingBottom: 8, paddingTop: 6 },
      tabBarActiveTintColor: '#F0A3EF', tabBarInactiveTintColor: '#183675',
      tabBarLabel: ({ focused }) => <Text style={{ color: focused ? '#F0A3EF' : '#183675', fontSize: 10, fontWeight: '500' }}>{route.name}</Text>,
      tabBarItemStyle: { transform: [{ translateY: -8 }] },
      tabBarIcon: ({ focused, size }) => (
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: focused ? '#F0A3EF' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {route.name === 'Wellness Tips' ? (
            <SvgXml xml={wellnessIconXml.replace(/#12316B/g, focused ? '#FFFFFF' : '#183675')} width={size} height={size} />
          ) : (
            <Ionicons name={icons[route.name]} size={size} color={focused ? '#FFFFFF' : '#183675'} />
          )}
        </View>
      ),
    })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wellness Tips" component={WellnessTipsScreen} />
      <Tab.Screen name="Tracker" component={TrackerScreen} />
      <Tab.Screen name="Favourite" component={FavouritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { token, loading } = useAuth(); const { theme } = useTheme();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  return (
    <NavigationContainer theme={theme.dark ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
            <Stack.Screen name="WaterIntake" component={WaterIntakeScreen} options={{ animation: 'slide_from_right' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Plans" component={PlansScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
