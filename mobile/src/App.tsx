import React from 'react';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from './theme';
import { PlanScreen } from './screens/PlanScreen';
import { TravelScreen } from './screens/TravelScreen';
import { EmergencyScreen } from './screens/EmergencyScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { AboutScreen } from './screens/AboutScreen';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const ICON: Record<string, string> = {
  Plan: '🗺️',
  Travel: '📍',
  Emergency: '🆘',
  Community: '👥',
  About: 'ℹ️',
};

function tabIcon(name: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 18, color }}>{ICON[name]}</Text>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          }}
        >
          <Tab.Screen name="Plan" component={PlanScreen} options={{ tabBarIcon: tabIcon('Plan') }} />
          <Tab.Screen name="Travel" component={TravelScreen} options={{ tabBarIcon: tabIcon('Travel') }} />
          <Tab.Screen name="Emergency" component={EmergencyScreen} options={{ tabBarIcon: tabIcon('Emergency') }} />
          <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarIcon: tabIcon('Community') }} />
          <Tab.Screen name="About" component={AboutScreen} options={{ tabBarIcon: tabIcon('About') }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
