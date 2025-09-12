import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

// Import screens (we'll create these next)
import SignInScreen from '../screens/auth/SignInScreen'
import SignUpScreen from '../screens/auth/SignUpScreen'
import GigsScreen from '../screens/gigs/GigsScreen'
import GigDetailScreen from '../screens/gigs/GigDetailScreen'
import CreateGigScreen from '../screens/gigs/CreateGigScreen'
import ProfileScreen from '../screens/profile/ProfileScreen'
import ApplicationsScreen from '../screens/applications/ApplicationsScreen'
import MessagesScreen from '../screens/messages/MessagesScreen'

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  SignIn: undefined
  SignUp: undefined
  GigDetail: { gigId: string }
  CreateGig: undefined
  Profile: { userId?: string }
  Applications: undefined
  Messages: undefined
}

export type MainTabParamList = {
  Gigs: undefined
  Applications: undefined
  CreateGig: undefined
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

          if (route.name === 'Gigs') {
            iconName = focused ? 'search' : 'search-outline'
          } else if (route.name === 'Applications') {
            iconName = focused ? 'document-text' : 'document-text-outline'
          } else if (route.name === 'CreateGig') {
            iconName = focused ? 'add-circle' : 'add-circle-outline'
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#4F46E5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Gigs" component={GigsScreen} options={{ title: 'Browse Gigs' }} />
      <Tab.Screen name="Applications" component={ApplicationsScreen} />
      <Tab.Screen name="CreateGig" component={CreateGigScreen} options={{ title: 'Create' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  // TODO: Check authentication state from Supabase
  React.useEffect(() => {
    // Check if user is logged in
    // setIsAuthenticated(!!user)
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="GigDetail" 
              component={GigDetailScreen}
              options={{ headerShown: true, title: 'Gig Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}