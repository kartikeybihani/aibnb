export default {
  expo: {
    name: "hacker",
    slug: "hacker",
    version: "1.0.0",
    main: "index.tsx",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "hacker",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey:
          process.env.GOOGLE_MAPS_API_KEY ||
          "AIzaSyAl5NtW4EpK6u7US4Q8W5lMOsVOwOsGgng",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_API_KEY ||
            "AIzaSyAl5NtW4EpK6u7US4Q8W5lMOsVOwOsGgng",
        },
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      reactCompiler: true,
    },
  },
};
