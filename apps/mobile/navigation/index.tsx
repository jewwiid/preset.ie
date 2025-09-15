import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { Platform } from 'react-native'
import { useAuth } from '../lib/auth-context'
import { colors } from '../styles/colors'

// Import screens
import HomeScreen from '../screens/HomeScreen'
import DashboardScreen from '../screens/DashboardScreen'
import SignInScreen from '../screens/auth/SignInScreen'
import SignUpScreen from '../screens/auth/SignUpScreen'
import GigsScreen from '../screens/gigs/GigsScreen'
import GigDetailScreen from '../screens/gigs/GigDetailScreen'
import CreateGigScreen from '../screens/gigs/CreateGigScreen'
import ShowcasesScreen from '../screens/ShowcasesScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'
import ApplicationsScreen from '../screens/applications/ApplicationsScreen'
import MessagesScreen from '../screens/messages/MessagesScreen'

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Home: undefined
  Dashboard: undefined
  SignIn: undefined
  SignUp: undefined
  Gigs: undefined
  GigDetail: { gigId: string }
  CreateGig: undefined
  Showcases: undefined
  Profile: { userId?: string }
  Applications: undefined
  Messages: undefined
}

export type MainTabParamList = {
  Home: undefined
  Gigs: undefined
  Showcases: undefined
  Messages: undefined
  Profile: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'Gigs') {
            iconName = focused ? 'search' : 'search-outline'
          } else if (route.name === 'Showcases') {
            iconName = focused ? 'images' : 'images-outline'
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.preset[500],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.primary,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        headerStyle: {
          backgroundColor: colors.preset[500],
          ...Platform.select({
            ios: {
              shadowColor: colors.preset[500],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        headerTintColor: colors.text.inverse,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Gigs" component={GigsScreen} options={{ title: 'Browse Gigs' }} />
      <Tab.Screen name="Showcases" component={ShowcasesScreen} options={{ title: 'Showcases' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  )
}

export default function Navigation() {
  const { user, loading } = useAuth()

  if (loading) {
    // You could show a loading screen here
    return null
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ 
                headerShown: true, 
                title: 'Dashboard',
                headerStyle: {
                  backgroundColor: colors.preset[500],
                },
                headerTintColor: colors.text.inverse,
              }}
            />
            <Stack.Screen 
              name="GigDetail" 
              component={GigDetailScreen}
              options={{ 
                headerShown: true, 
                title: 'Gig Details',
                headerStyle: {
                  backgroundColor: colors.preset[500],
                },
                headerTintColor: colors.text.inverse,
              }}
            />
            <Stack.Screen 
              name="CreateGig" 
              component={CreateGigScreen}
              options={{ 
                headerShown: true, 
                title: 'Create Gig',
                headerStyle: {
                  backgroundColor: colors.preset[500],
                },
                headerTintColor: colors.text.inverse,
              }}
            />
            <Stack.Screen 
              name="Applications" 
              component={ApplicationsScreen}
              options={{ 
                headerShown: true, 
                title: 'Applications',
                headerStyle: {
                  backgroundColor: colors.preset[500],
                },
                headerTintColor: colors.text.inverse,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}