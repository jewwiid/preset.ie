# Preset Mobile App

A native mobile application for Preset, built with Expo and React Native. This app provides the same functionality as the web application but optimized for iOS and Android devices.

## 🚀 Features

- **Native Mobile Experience**: Optimized for iOS and Android with platform-specific design patterns
- **Full Feature Parity**: All web app functionality available on mobile
- **Real-time Data**: Live updates using Supabase real-time subscriptions
- **Offline Support**: Core features work offline with data synchronization
- **Push Notifications**: Real-time notifications for messages, applications, and gigs
- **Camera Integration**: Built-in camera for capturing photos and creating moodboards
- **Location Services**: Location-based gig discovery and filtering
- **Secure Storage**: Encrypted local storage for sensitive data

## 📱 Screens

### Core Screens
- **Home**: Landing page with featured gigs and showcases
- **Dashboard**: User overview with stats and recent activity
- **Gigs**: Browse and search creative gigs
- **Showcases**: Portfolio gallery with filtering
- **Messages**: Real-time chat system
- **Profile**: User settings and account management

### Additional Screens
- **Gig Detail**: Detailed view of individual gigs
- **Create Gig**: Form for contributors to post new gigs
- **Applications**: Manage job applications
- **Sign In/Sign Up**: Authentication flows

## 🛠 Technology Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: React Context + Hooks
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Styling**: React Native StyleSheet with design system
- **Icons**: Expo Vector Icons (Ionicons)
- **Storage**: Expo SecureStore + AsyncStorage
- **Camera**: Expo Camera
- **Image Picker**: Expo Image Picker
- **Location**: Expo Location

## 🎨 Design System

The mobile app uses a comprehensive design system that matches the web application:

### Colors
- **Primary**: Preset brand colors (#00876f)
- **Semantic**: Success, warning, error, info colors
- **Platform**: iOS and Android system colors
- **Dark Mode**: Full dark mode support

### Typography
- **iOS**: System font family
- **Android**: Roboto font family
- **Responsive**: Scales based on device size
- **Hierarchy**: H1-H6, body, caption, button text styles

### Components
- **Button**: Multiple variants (default, outline, ghost, link, destructive)
- **Card**: Elevated cards with shadows/elevation
- **Input**: Form inputs with validation states
- **Badge**: Status indicators and tags
- **Navigation**: Bottom tabs with platform-specific styling

## 📦 Installation

1. **Prerequisites**
   ```bash
   npm install -g @expo/cli
   npm install -g eas-cli
   ```

2. **Install Dependencies**
   ```bash
   cd apps/mobile
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

5. **Run on Device**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 🔧 Configuration

### Environment Variables
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Platform Configuration
- **iOS**: Configured for App Store submission
- **Android**: Configured for Google Play Store
- **Deep Linking**: Supports preset.ie links
- **Permissions**: Camera, location, storage access

## 🏗 Architecture

### File Structure
```
apps/mobile/
├── components/
│   └── ui/                 # Design system components
├── screens/                # Screen components
├── navigation/             # Navigation configuration
├── lib/                    # Utilities and services
│   ├── supabase.ts         # Database client
│   ├── auth-context.tsx    # Authentication context
│   ├── platform.ts         # Platform utilities
│   └── responsive.ts       # Responsive utilities
├── styles/                 # Design system tokens
│   ├── colors.ts           # Color definitions
│   ├── typography.ts       # Typography system
│   └── spacing.ts          # Spacing and layout
└── assets/                 # Images and icons
```

### State Management
- **Authentication**: Context-based auth state
- **User Data**: React hooks with Supabase
- **Navigation**: React Navigation state
- **Local Storage**: Secure encrypted storage

### Data Flow
1. **Authentication**: Supabase Auth with encrypted storage
2. **API Calls**: Direct Supabase client calls
3. **Real-time**: Supabase subscriptions for live updates
4. **Caching**: Local storage for offline support

## 🚀 Deployment

### Development Build
```bash
eas build --platform ios --profile development
eas build --platform android --profile development
```

### Production Build
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### App Store Submission
```bash
eas submit --platform ios
eas submit --platform android
```

## 📱 Platform Optimizations

### iOS
- **Design**: iOS Human Interface Guidelines
- **Navigation**: Native iOS navigation patterns
- **Gestures**: Swipe gestures and haptic feedback
- **Performance**: Optimized for iOS rendering

### Android
- **Design**: Material Design principles
- **Navigation**: Android navigation patterns
- **Back Button**: Hardware back button support
- **Performance**: Optimized for Android rendering

## 🔒 Security

- **Authentication**: Secure token-based auth
- **Storage**: Encrypted local storage
- **Network**: HTTPS-only communication
- **Permissions**: Minimal required permissions
- **Data**: Client-side data validation

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📈 Performance

- **Bundle Size**: Optimized with tree shaking
- **Images**: Lazy loading and caching
- **Navigation**: Optimized screen transitions
- **Memory**: Efficient component lifecycle
- **Network**: Request batching and caching

## 🐛 Debugging

### Development Tools
- **Expo Dev Tools**: Built-in debugging
- **React Native Debugger**: Advanced debugging
- **Flipper**: Platform-specific debugging
- **Console Logs**: Comprehensive logging

### Common Issues
- **Metro Bundler**: Clear cache with `npx expo start --clear`
- **Dependencies**: Use `npm install --legacy-peer-deps` if needed
- **iOS Simulator**: Reset simulator if issues persist
- **Android Emulator**: Clear emulator data if needed

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add proper error handling
4. Include loading states
5. Test on both iOS and Android
6. Update documentation as needed

## 📄 License

This project is licensed under the same license as the main Preset project.

## 🆘 Support

For issues and questions:
- Check the [Expo documentation](https://docs.expo.dev/)
- Review [React Navigation docs](https://reactnavigation.org/)
- Consult [Supabase docs](https://supabase.com/docs)
- Open an issue in the main repository