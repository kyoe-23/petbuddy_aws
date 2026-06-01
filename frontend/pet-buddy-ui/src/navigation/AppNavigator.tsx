import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { useAuthStore } from '../store/auth'
import { theme } from '../styles/theme'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import OwnerHomeScreen from '../screens/owner/HomeScreen'
import OwnerChatScreen from '../screens/owner/ChatScreen'
import ChatRoom from '../screens/ChatRoom'
import OwnerProfileScreen from '../screens/owner/ProfileScreen'
import SitterHomeScreen from '../screens/sitter/HomeScreen'
import SitterChatScreen from '../screens/sitter/ChatScreen'
import SitterProfileScreen from '../screens/sitter/ProfileScreen'
// 강아지 등록 화면들
import DogPhotoCaptureScreen from '../screens/owner/DogPhotoCapture'
import DogAIAnalysisScreen from '../screens/owner/DogAIAnalysis'
import DogBasicInfoScreen from '../screens/owner/DogBasicInfo'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// 견주 탭 네비게이터
const OwnerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap

        if (route.name === 'OwnerHome') {
          iconName = focused ? 'home' : 'home-outline'
        } else if (route.name === 'OwnerChat') {
          iconName = focused ? 'chatbubble' : 'chatbubble-outline'
        } else if (route.name === 'OwnerProfile') {
          iconName = focused ? 'person' : 'person-outline'
        } else {
          iconName = 'home-outline'
        }

        return <Ionicons name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: '#f97316',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="OwnerHome" 
      component={OwnerHomeScreen}
      options={{ tabBarLabel: '홈' }}
    />
    <Tab.Screen 
      name="OwnerChat" 
      component={OwnerChatScreen}
      options={{ tabBarLabel: '채팅' }}
    />
    <Tab.Screen 
      name="OwnerProfile" 
      component={OwnerProfileScreen}
      options={{ tabBarLabel: '프로필' }}
    />
  </Tab.Navigator>
)

// 시터 탭 네비게이터
const SitterTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap

        if (route.name === 'SitterHome') {
          iconName = focused ? 'home' : 'home-outline'
        } else if (route.name === 'SitterChat') {
          iconName = focused ? 'chatbubble' : 'chatbubble-outline'
        } else if (route.name === 'SitterProfile') {
          iconName = focused ? 'person' : 'person-outline'
        } else {
          iconName = 'home-outline'
        }

        return <Ionicons name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: '#0ea5e9',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="SitterHome" 
      component={SitterHomeScreen}
      options={{ tabBarLabel: '홈' }}
    />
    <Tab.Screen 
      name="SitterChat" 
      component={SitterChatScreen}
      options={{ tabBarLabel: '채팅' }}
    />
    <Tab.Screen 
      name="SitterProfile" 
      component={SitterProfileScreen}
      options={{ tabBarLabel: '프로필' }}
    />
  </Tab.Navigator>
)

const AppNavigator = () => {
  const { isAuthenticated, activeRole } = useAuthStore()

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // 인증되지 않은 경우
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // 인증된 경우 - 역할에 따라 다른 탭 네비게이터
          <>
            {activeRole === 'owner' ? (
              <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
            ) : (
              <Stack.Screen name="SitterTabs" component={SitterTabs} />
            )}
            <Stack.Screen name="ChatRoom" component={ChatRoom} />
            {/* 강아지 등록 플로우 */}
            <Stack.Screen 
              name="DogPhotoCapture" 
              component={DogPhotoCaptureScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="DogAIAnalysis" 
              component={DogAIAnalysisScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="DogBasicInfo" 
              component={DogBasicInfoScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
