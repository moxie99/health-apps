// navigation/AppNavigator.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import MainTabNavigator from './MainTabNavigator'
import { RootStackParamList } from '../types/navigation'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ConfirmEmailScreen from '../screens/ConfirmEmailScreen'
import KYCStatusScreen from '../screens/KYCStatusScreen'
import { useAuthStore } from '../storage/authStore'
import PendingApproval from '../screens/PendingApproval'
import ForgotPasswordScreen from '../screens/ResetPasswordScreen'
import ResetPasswordScreen from '../screens/ResetPasswordScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

function AppNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { user } = useAuthStore((state) => state)
  console.log('==++++++=', user, isAuthenticated)
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          isAuthenticated && user?.status === 'pending'
            ? 'PendingApproval'
            : isAuthenticated
            ? 'MainTabs'
            : 'Login'
        }
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name='Login' component={LoginScreen} />
            <Stack.Screen name='Register' component={RegisterScreen} />
            <Stack.Screen name='ConfirmEmail' component={ConfirmEmailScreen} />
            <Stack.Screen
              name='ForgotPassword'
              component={ForgotPasswordScreen}
            />
            <Stack.Screen
              name='ResetPassword'
              component={ResetPasswordScreen}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name='MainTabs' component={MainTabNavigator} />
            <Stack.Screen name='PendingApproval' component={PendingApproval} />
            <Stack.Screen name='KYCStatus' component={KYCStatusScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
