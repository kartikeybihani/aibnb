# Travel Planning App 🌍

A React Native travel planning app with AI-powered trip intake using Anthropic's Claude.

## Features

- **Smart Trip Intake**: AI extracts structured travel preferences from natural language
- **Interactive Chat**: Follow-up questions with quick reply chips
- **Seamless Flow**: From chat to itinerary generation
- **Beautiful UI**: Modern, intuitive design

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file with:

```bash
# Anthropic API Key - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# API Base URL for development
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Development

**Start the API server:**
```bash
npm run dev:api
```

**Start the Expo app (in another terminal):**
```bash
npm start
```

## API Integration

The app uses a serverless function (`api/userQuery.js`) that:
- Extracts structured travel data using Anthropic Claude
- Validates and merges partial intake data
- Provides follow-up questions until complete
- Returns ready-to-use travel preferences

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
