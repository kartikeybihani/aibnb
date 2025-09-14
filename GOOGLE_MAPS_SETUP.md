# Google Maps Setup

## ✅ Issue Fixed!
The previous error was caused by trying to use `react-native-maps` as an Expo config plugin, which it doesn't support. This has been resolved by using proper configuration in `app.config.js`.

## Prerequisites

To use Google Maps in your app, you need to:

1. **Get a Google Maps API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Maps SDK for iOS" and "Maps SDK for Android" APIs
   - Create credentials (API Key)
   - Restrict the API key to your app bundle identifier

2. **Configure the API Key**
   - Option 1: Create a `.env` file in your project root
     ```
     GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     ```
   - Option 2: Replace `YOUR_GOOGLE_MAPS_API_KEY` in `app.config.js` with your actual API key
   - The key is configured in:
     - `ios.config.googleMapsApiKey` (for iOS)
     - `android.config.googleMaps.apiKey` (for Android)

## Features Implemented

✅ **Interactive Map Modal**
- Shows all itinerary locations as pins
- Automatic zoom to fit all pins
- Google Maps provider (not Apple Maps)

✅ **Tap to Add Locations**
- Tap anywhere on the map to add a custom pin
- Shows place details and weather information
- Zoom to the new location automatically

✅ **Location Information**
- Place name and description
- Weather information (temperature, condition, humidity)
- Different pin colors for itinerary vs custom locations

✅ **Map Controls**
- User location button
- Compass
- Scale indicator
- Smooth animations

## Usage

1. Open the itinerary screen
2. Tap the "View on Map" button below the summary
3. The map will show all your itinerary locations
4. Tap anywhere on the map to add custom locations
5. Tap on pins to see location details

## Security Note

Remember to restrict your Google Maps API key to your iOS app bundle identifier to prevent unauthorized usage.
