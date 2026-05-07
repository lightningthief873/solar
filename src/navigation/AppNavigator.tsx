import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ExploreScreen from '../screens/ExploreScreen';
import PlantScreen from '../screens/PlantScreen';
import InventoryScreen from '../screens/InventoryScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootTabParamList = {
  Explore: undefined;
  Plant: undefined;
  Inventory: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<string, string> = {
  Explore: '◎',
  Plant: '⊕',
  Inventory: '▦',
  Leaderboard: '◆',
  Profile: '◉',
};

const ACCENT: Record<string, string> = {
  Explore: '#00BFFF',
  Plant: '#00FF88',
  Inventory: '#9B59B6',
  Leaderboard: '#F39C12',
  Profile: '#4A90E2',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? (ACCENT[name] ?? '#FFF') : '#555';
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.icon, { color }]}>{ICONS[name]}</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Explore"
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: ACCENT[route.name] ?? '#FFF',
            tabBarInactiveTintColor: '#555',
            tabBarLabelStyle: styles.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon name={route.name} focused={focused} />
            ),
          })}
        >
          <Tab.Screen name="Explore" component={ExploreScreen} />
          <Tab.Screen name="Plant" component={PlantScreen} />
          <Tab.Screen name="Inventory" component={InventoryScreen} />
          <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0A0A0F',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
});
