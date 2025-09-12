# Preset Mobile App

React Native mobile application for Preset - Creative Collaboration Platform

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **Supabase** for backend
- **NativeWind** for styling
- **Expo modules** for native functionality

## Setup

### Prerequisites

- Node.js 18+
- iOS Simulator (Mac) or Android Emulator
- Expo CLI (`npm install -g expo-cli`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Add your Supabase credentials to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Expo Go (Development)
```bash
npm start
```
Then scan the QR code with Expo Go app on your phone.

## Project Structure

```
apps/mobile/
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   ├── gigs/         # Gig browsing and details
│   ├── applications/ # Application management
│   ├── messages/     # Messaging screens
│   └── profile/      # User profile screens
├── navigation/       # Navigation configuration
├── lib/             # Utilities and services
│   └── supabase.ts  # Supabase client setup
├── components/      # Reusable components
└── assets/         # Images and static assets
```

## Features

### Authentication
- Email/password sign in
- Secure token storage with Expo SecureStore
- Auto session refresh

### Gig Discovery
- Browse available gigs
- Filter by compensation type
- Location-based search
- Real-time updates

### Applications
- Apply to gigs
- Track application status
- Manage shortlists

### Messaging
- Per-gig chat threads
- Push notifications
- Media attachments

### Profile
- View and edit profile
- Portfolio showcase
- Verification badges

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_API_URL` | Backend API URL |

## Troubleshooting

### Metro bundler issues
```bash
npx expo start --clear
```

### iOS build errors
```bash
cd ios && pod install
```

### Android build errors
```bash
cd android && ./gradlew clean
```

## License

Proprietary - Preset.ie