/* eslint-disable react/no-unstable-nested-components */
// navigation/MainTabNavigator.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BottomTabParamList } from '../types/navigation'
import HomeScreen from '../screens/HomeScreen'
import ExploreScreen from '../screens/ExploreScreen'
import SettingsScreen from '../screens/SettingsScreen'
import TabBarBackground from '../components/ui/TabBarBackground'
import { Platform, useColorScheme } from 'react-native'
import { HapticTab } from '../components/HapticTab'
import { Colors } from '../constants/Colors'
import { IconSymbol } from '../components/ui/IconSymbol'
import { useAuthStore } from '../storage/authStore'
import StatusModal from '../components/StatusModal'
import { useNavigation } from '@react-navigation/native'

const Tab = createBottomTabNavigator<BottomTabParamList>()

function MainTabNavigator(): React.JSX.Element {
  const colorScheme = useColorScheme()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { user } = useAuthStore((state) => state)
  const navigation = useNavigation()
  console.log(user)
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tab.Screen
          name='Home'
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='house.fill' color={color} />
            ),
          }}
        />
        <Tab.Screen
          name='Explore'
          component={ExploreScreen}
          options={{
            tabBarLabel: 'Explore',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='paperplane.fill' color={color} />
            ),
          }}
        />
        <Tab.Screen
          name='Settings'
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name='gear.circle.fill' color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <StatusModal
        visible={true}
        status='info'
        title='Profile Completion'
        subtitle='Please, kindly complete your profile to be able to see, accept orders and start earning'
        buttonText='PROCEED'
        onPrimaryPress={() => {
          navigation.navigate('KYCStatus')
        }}
      />
    </>
  )
}

export default MainTabNavigator
