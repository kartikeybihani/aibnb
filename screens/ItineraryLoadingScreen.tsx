import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { TravelIntakeAPI } from "../services/api";

// Color tokens (consistent with other screens)
const colors = {
  bgTop: "#FFF8F2",
  bgBot: "#FFE8D6",
  surface: "#FFFFFF",
  text: "#0F172A",
  subtext: "#475569",
  accent: "#FF6B3D",
  accentSoft: "#FFD8C7",
  border: "#F2E8DF",
  placeholder: "#9AA4B2",
  shadow: "rgba(255,107,61,0.25)",
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ItineraryLoadingScreenProps {
  navigation: any;
  route: any;
}

export default function ItineraryLoadingScreen({
  navigation,
  route,
}: ItineraryLoadingScreenProps) {
  // Get data from route params
  const { intake, options, swipeData } = route.params || {};

  // API instance
  const [api] = React.useState(() => new TravelIntakeAPI());

  // Animation values
  const pulseScale = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const fadeInValue = useSharedValue(0);
  const slideUpValue = useSharedValue(50);
  const dotOpacity1 = useSharedValue(0.3);
  const dotOpacity2 = useSharedValue(0.3);
  const dotOpacity3 = useSharedValue(0.3);

  // API call to compose itinerary
  const composeItinerary = async () => {
    try {
      console.log(
        "🎯 Calling composeItinerary from ItineraryLoadingScreen with:",
        {
          intake,
          options: {
            restaurants: options?.restaurants?.length || 0,
            activities: options?.activities?.length || 0,
            categories: options?.categories?.length || 0,
          },
          swipes: swipeData,
        }
      );

      // Validate required data before making API call
      if (!intake) {
        throw new Error("No intake data available");
      }

      if (!options || !options.restaurants || !options.activities) {
        throw new Error("Insufficient options data for itinerary creation");
      }

      if (swipeData.totalSwiped === 0) {
        console.log(
          "⚠️ No swipes recorded, using all available options as liked"
        );
        // If no swipes, assume user likes all options
        const allRestaurantIds = options.restaurants.map(
          (r) =>
            r.id ||
            r.name?.toLowerCase().replace(/\s+/g, "-") + "-restaurant" ||
            `restaurant-${Math.random()}`
        );
        // Update swipeData for the API call
        swipeData.liked = allRestaurantIds;
        swipeData.totalSwiped = allRestaurantIds.length;
      }

      const data = await api.composeItinerary(intake, options, swipeData);
      console.log("✅ Itinerary composed:", {
        status: data.status,
        hasItinerary: !!data.itinerary,
        title: data.itinerary?.title,
        days: data.itinerary?.days?.length,
      });

      if (data.status === "ok" && data.itinerary) {
        // Navigate to itinerary screen with the composed itinerary
        navigation.navigate("Itinerary", {
          itinerary: data.itinerary,
          meta: data.meta,
          intake,
          options, // Pass options data for map coordinates
        });
      } else {
        throw new Error("Invalid itinerary response from API");
      }
    } catch (error) {
      console.error("💥 Error composing itinerary:", error);
      // Fallback navigation with error
      navigation.navigate("Itinerary", {
        itinerary: null,
        error: error instanceof Error ? error.message : "Unknown error",
        intake, // Pass intake data for fallback display
        options, // Pass options data even in error case
      });
    }
  };

  useEffect(() => {
    // Start the API call immediately
    composeItinerary();

    // Fade in animation
    fadeInValue.value = withTiming(1, { duration: 800 });
    slideUpValue.value = withTiming(0, { duration: 800 });

    // Pulse animation for the main icon
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );

    // Rotation animation
    rotateValue.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );

    // Dots animation
    const animateDots = () => {
      dotOpacity1.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      );

      setTimeout(() => {
        dotOpacity2.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        );
      }, 200);

      setTimeout(() => {
        dotOpacity3.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        );
      }, 400);
    };

    // Start dots animation
    const dotsInterval = setInterval(animateDots, 1200);
    animateDots(); // Initial call

    return () => {
      clearInterval(dotsInterval);
    };
  }, [navigation]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
    transform: [{ translateY: slideUpValue.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dotOpacity1.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dotOpacity2.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dotOpacity3.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Main Icon with Pulse Animation */}
        <Animated.View style={[styles.iconContainer, pulseStyle]}>
          <Animated.View style={[styles.iconWrapper, rotateStyle]}>
            <Ionicons name="airplane" size={80} color={colors.accent} />
          </Animated.View>
        </Animated.View>

        {/* Main Message */}
        <Animated.View style={[styles.textContainer, fadeInStyle]}>
          <Text style={styles.mainText}>Perfect!</Text>
          <Text style={styles.subText}>
            Crafting the whole itinerary for you...
          </Text>

          {/* Loading Dots */}
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, dot1Style]} />
            <Animated.View style={[styles.dot, dot2Style]} />
            <Animated.View style={[styles.dot, dot3Style]} />
          </View>
        </Animated.View>

        {/* Secondary Icons */}
        <Animated.View style={[styles.secondaryIcons, fadeInStyle]}>
          <View style={styles.iconItem}>
            <Ionicons name="location" size={24} color={colors.accent} />
            <Text style={styles.iconLabel}>Places</Text>
          </View>
          <View style={styles.iconItem}>
            <Ionicons name="restaurant" size={24} color={colors.accent} />
            <Text style={styles.iconLabel}>Dining</Text>
          </View>
          <View style={styles.iconItem}>
            <Ionicons name="bed" size={24} color={colors.accent} />
            <Text style={styles.iconLabel}>Stays</Text>
          </View>
          <View style={styles.iconItem}>
            <Ionicons name="train" size={24} color={colors.accent} />
            <Text style={styles.iconLabel}>Transport</Text>
          </View>
        </Animated.View>

        {/* Progress Indicator */}
        <Animated.View style={[styles.progressContainer, fadeInStyle]}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>Creating your dream trip...</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgTop,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  mainText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  subText: {
    fontSize: 18,
    color: colors.subtext,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  secondaryIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 60,
  },
  iconItem: {
    alignItems: "center",
    gap: 8,
  },
  iconLabel: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: "500",
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 2,
    width: "100%",
  },
  progressText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
  },
});
