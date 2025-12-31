# Food App - Frontend (React Native Expo)

A modern, feature-rich mobile food discovery application built with React Native and Expo. This app helps users find restaurants, explore dishes, get personalized recommendations, and interact with an AI-powered chatbot.

## Features

### Authentication
- Email/Password registration with email verification
- Google Sign-In integration
- Secure authentication using Firebase
- Profile management with avatar upload
- Password change functionality

### Home & Discovery
- Browse featured restaurants and popular dishes
- Category-based food exploration
- Personalized recommendations
- Recently viewed history
- Favorite restaurants and dishes

### Interactive Map
- Real-time restaurant location display
- Custom map markers with restaurant details
- Distance calculation from user location
- Filter restaurants by categories and preferences
- Interactive navigation to restaurant details

### AI Chatbot
- Intelligent food recommendations
- Natural language conversation
- Context-aware suggestions
- Integration with restaurant database

### Search & Filter
- Search for restaurants and dishes
- Filter by categories, ratings, and distance
- Sort by popularity, rating, or distance

### User Profile
- View and edit profile information
- Upload custom avatar
- Manage favorite restaurants
- View order history
- Settings and preferences

## Tech Stack

### Core Technologies
- **Framework**: React Native (v0.81.5)
- **Runtime**: Expo (v54.0.13)
- **Language**: JavaScript (JSX)
- **UI**: React (v19.1.0)

### Navigation
- `@react-navigation/native` - Core navigation
- `@react-navigation/native-stack` - Stack navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/stack` - Stack transitions

### UI & Animations
- `react-native-reanimated` - Smooth animations
- `moti` - Declarative animations
- `expo-linear-gradient` - Gradient backgrounds
- `react-native-gesture-handler` - Gesture handling

### Maps & Location
- `react-native-maps` - Interactive maps
- `expo-location` - Location services
- `polyline` - Route polyline encoding/decoding

### State Management & Storage
- `@react-native-async-storage/async-storage` - Local data persistence
- React Context API - Global state management

### API & Network
- `axios` - HTTP client for API requests

### Additional Features
- `expo-image-picker` - Image selection and camera access
- `@expo/ngrok` - Development tunneling

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend_food_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   API_URL=http://your-backend-url:5000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device/emulator**
   - For iOS: Press `i` in the terminal or scan QR code with Camera app
   - For Android: Press `a` in the terminal or scan QR code with Expo Go app
   - For Web: Press `w` in the terminal

## Project Structure

```
frontend_food_app/
├── assets/                 # Images, fonts, and other static assets
├── components/            # Reusable UI components
│   ├── CategoryCard.jsx
│   ├── RestaurantCard.jsx
│   ├── FoodCard.jsx
│   └── ...
├── context/              # React Context providers
│   ├── AuthContext.jsx   # Authentication state
│   └── ...
├── data/                 # Static data and constants
├── hooks/                # Custom React hooks
├── navigators/           # Navigation configuration
│   ├── AppNavigator.jsx
│   ├── AuthNavigator.jsx
│   ├── MainTabNavigator.jsx
│   └── ...
├── screens/              # App screens
│   ├── HomeScreen.jsx
│   ├── MapScreen.jsx
│   ├── ProfileScreen.jsx
│   ├── LoginScreen.jsx
│   ├── RegisterScreen.jsx
│   ├── ChatBotScreen.jsx
│   └── ...
├── services/             # API services
│   ├── api.js           # API client configuration
│   └── ...
├── App.jsx              # App entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── babel.config.js      # Babel configuration
```

## Key Components

### Screens
- **HomeScreen** - Main dashboard with featured content
- **MapScreen** - Interactive map with restaurant locations
- **RestaurantDetailScreen** - Detailed restaurant information
- **FoodDetailScreen** - Detailed dish information
- **ProfileScreen** - User profile and settings
- **LoginScreen** - User authentication
- **RegisterScreen** - New user registration
- **ChatBotScreen** - AI-powered food recommendations
- **FavoriteScreen** - User's favorite restaurants
- **SearchScreen** - Search and filter functionality

### Context
- **AuthContext** - Manages user authentication state and provides auth methods throughout the app

### Services
- **api.js** - Centralized API configuration and HTTP client setup

## API Integration

The app communicates with the backend API at the configured `API_URL`. Key endpoints include:

- `/api/register` - User registration
- `/api/login` - User login
- `/api/google-login` - Google authentication
- `/api/restaurants` - Get restaurants
- `/api/foods` - Get food items
- `/api/chatbot` - AI chatbot interactions
- `/api/user` - User profile operations

For detailed API documentation, refer to the backend repository.

## Available Scripts

```bash
# Start Expo development server
npm start

# Start on Android
npm run android

# Start on iOS
npm run ios

# Start on Web
npm run web
```

## Design Patterns

- **Context API** - Global state management for authentication
- **Component Composition** - Reusable, modular components
- **Custom Hooks** - Encapsulated logic for data fetching and state
- **Navigator Pattern** - Organized screen navigation structure

## Security

- Secure token storage using AsyncStorage
- Firebase Authentication integration
- HTTPS API communication
- Secure password handling (never stored in plain text)

## Platform Compatibility

- ✅ iOS (11.0+)
- ✅ Android (5.0+)
- ✅ Web (experimental)

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
# Clear cache
expo start -c
```

**Module resolution errors:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**iOS build issues:**
```bash
# Clear iOS build folder
cd ios && pod install && cd ..
```

**Android build issues:**
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
```

## License

This project is part of a private food app system.

## Development

### Code Style
- Use functional components with hooks
- Follow React Native best practices
- Use meaningful variable and component names
- Keep components small and focused
- Add comments for complex logic

### Best Practices
- Test on both iOS and Android devices
- Optimize images and assets
- Use lazy loading for heavy components
- Implement proper error handling
- Add loading states for async operations

## Version

**Current Version:** 1.0.0

---

**Made with React Native & Expo**
