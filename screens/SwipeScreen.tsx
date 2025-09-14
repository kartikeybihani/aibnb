import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { TravelIntakeAPI } from "../services/api";

// Color tokens (same as LoadingScreen)
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
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = screenHeight * 0.75;

// Overlay snap points
const OVERLAY_COLLAPSED = CARD_HEIGHT * 0.2;
const OVERLAY_EXPANDED = Math.min(screenHeight * 0.7, CARD_HEIGHT);

const restaurants = [
  {
    id: 1,
    name: "Bella Vista",
    image: require("../assets/images/swipe1.jpg"),
    rating: 4.8,
    description:
      "Authentic Italian cuisine with a modern twist, featuring fresh ingredients and traditional recipes passed down through generations.",
    phone: "(555) 123-4567",
    address: "123 Main Street, Downtown",
    hours: "Open until 10:00 PM",
    cuisine: "Italian • Fine Dining • $$",
    features: ["Outdoor Seating", "Wine Bar", "Live Music", "Romantic"],
  },
  {
    id: 2,
    name: "Sakura Sushi",
    image: require("../assets/images/swipe2.jpg"),
    rating: 4.6,
    description:
      "Premium Japanese sushi and sashimi with the freshest fish flown in daily from Tokyo's Tsukiji market.",
    phone: "(555) 234-5678",
    address: "456 Cherry Blossom Ave",
    hours: "Open until 11:00 PM",
    cuisine: "Japanese • Sushi • $$$",
    features: ["Omakase", "Sake Bar", "Private Dining", "Chef's Table"],
  },
  {
    id: 3,
    name: "Le Bistro",
    image: require("../assets/images/swipe3.jpg"),
    rating: 4.9,
    description:
      "Classic French bistro serving traditional dishes with a contemporary flair in an elegant Parisian atmosphere.",
    phone: "(555) 345-6789",
    address: "789 Rue de la Paix",
    hours: "Open until 9:30 PM",
    cuisine: "French • Bistro • $$$",
    features: ["Wine Cellar", "Patio", "Art Gallery", "Live Jazz"],
  },
  {
    id: 4,
    name: "Spice Garden",
    image: require("../assets/images/swipe4.jpeg"),
    rating: 4.5,
    description:
      "Authentic Indian cuisine with aromatic spices and traditional cooking methods passed down through generations.",
    phone: "(555) 456-7890",
    address: "321 Curry Lane",
    hours: "Open until 10:30 PM",
    cuisine: "Indian • Spicy • $$",
    features: [
      "Tandoor Oven",
      "Vegetarian Options",
      "Family Style",
      "Spice Market",
    ],
  },
  {
    id: 5,
    name: "Ocean's Edge",
    image: require("../assets/images/swipe5.jpeg"),
    rating: 4.7,
    description:
      "Fresh seafood restaurant with panoramic ocean views, featuring locally caught fish and sustainable practices.",
    phone: "(555) 567-8901",
    address: "654 Harbor View Drive",
    hours: "Open until 11:30 PM",
    cuisine: "Seafood • Fine Dining • $$$",
    features: ["Ocean View", "Raw Bar", "Rooftop", "Sustainable"],
  },
];

interface SwipeScreenProps {
  navigation: any;
  route: any;
}

export default function SwipeScreen({ navigation, route }: SwipeScreenProps) {
  const [currentRestaurantIndex, setCurrentRestaurantIndex] = React.useState(0);

  // Get intake and options from route params
  const { intake, options } = route.params || {};

  // Swipe tracking state
  const [swipeData, setSwipeData] = React.useState({
    liked: [] as string[],
    disliked: [] as string[],
    totalSwiped: 0,
  });

  // Loading state for itinerary composition
  const [isComposingItinerary, setIsComposingItinerary] = React.useState(false);

  // API instance
  const [api] = React.useState(() => new TravelIntakeAPI());

  // Card transforms
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const cardHeight = useSharedValue(CARD_HEIGHT);

  // "Next" card starts above the screen; we drop it in from the top.
  const newCardTranslateY = useSharedValue(-screenHeight);

  // effects for like/nope and backdrop flash
  const likeOpacity = useSharedValue(0);
  const nopeOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  // next card polish
  const nextCardScale = useSharedValue(0.96);
  const nextCardRotate = useSharedValue(0);

  // left-swipe dust trail skew
  const skewDeg = useSharedValue(0);

  // Bottom sheet overlay height (no more tying this to ScrollView scroll)
  const overlayHeight = useSharedValue(OVERLAY_COLLAPSED);
  const overlayDragStart = useSharedValue(OVERLAY_COLLAPSED);

  // We only enable inner content scrolling when expanded to avoid bounce
  const [scrollEnabled, setScrollEnabled] = React.useState(false);
  const [isOverlayExpanded, setIsOverlayExpanded] = React.useState(false);
  useDerivedValue(() => {
    const expanded =
      overlayHeight.value >= (OVERLAY_COLLAPSED + OVERLAY_EXPANDED) / 2;
    // move to JS only when the boolean actually changes
    runOnJS(setScrollEnabled)(expanded);
    runOnJS(setIsOverlayExpanded)(expanded);
  });

  // Combine restaurants and activities into a single swipeable collection
  const availableOptions = React.useMemo(() => {
    const allOptions = [];

    // Add restaurants with proper kind indicator
    if (options?.restaurants && options.restaurants.length > 0) {
      const processedRestaurants = options.restaurants.map((r) => ({
        ...r,
        kind: r.kind || "restaurant",
        type: "restaurant",
      }));
      allOptions.push(...processedRestaurants);

      console.log(
        "🍽️ Using API restaurants:",
        options.restaurants.length,
        "options"
      );
      console.log(
        "🍽️ Restaurant names:",
        options.restaurants.map((r) => r.title || r.name).join(", ")
      );
    }

    // Add activities with proper kind indicator
    if (options?.activities && options.activities.length > 0) {
      const processedActivities = options.activities.map((a) => ({
        ...a,
        kind: a.kind || "activity",
        type: "activity",
      }));
      allOptions.push(...processedActivities);

      console.log(
        "🎯 Using API activities:",
        options.activities.length,
        "options"
      );
      console.log(
        "🎯 Activity names:",
        options.activities.map((a) => a.title || a.name).join(", ")
      );
    }

    // If we have API data, shuffle the combined array for variety
    if (allOptions.length > 0) {
      // Simple shuffle algorithm
      for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
      }
      console.log(
        "🎲 Combined and shuffled options:",
        allOptions.length,
        "total (",
        allOptions.filter((o) => o.type === "restaurant").length,
        "restaurants,",
        allOptions.filter((o) => o.type === "activity").length,
        "activities)"
      );
      return allOptions;
    }

    // Fallback to hardcoded restaurants only if no API data
    console.log("🍽️ Falling back to hardcoded restaurants");
    return restaurants.map((r) => ({
      ...r,
      type: "restaurant",
      kind: "restaurant",
    }));
  }, [options?.restaurants, options?.activities]);

  const currentRestaurant = availableOptions?.[currentRestaurantIndex];

  // Log activities data when available
  React.useEffect(() => {
    if (options?.activities && options.activities.length > 0) {
      console.log(
        "🎯 API Activities received:",
        options.activities.length,
        "activities"
      );

      // Log all activity names
      console.log(
        "🎯 Activity names:",
        options.activities.map((a) => a.title || a.name).join(", ")
      );
    }
  }, [options?.activities]);

  // Log current data for debugging
  React.useEffect(() => {
    console.log("🔍 SwipeScreen Debug:", {
      availableOptionsCount: availableOptions?.length || 0,
      currentIndex: currentRestaurantIndex,
      currentRestaurant: currentRestaurant?.name || currentRestaurant?.title,
      isAPIData: !!(options?.restaurants?.length && !options?.isFallback && 
        !options?.restaurants?.some(r => 
          r.title?.includes("Sample") || 
          r.title?.includes("Kissaten") || 
          r.title?.includes("Tokyo") ||
          r.city === "Tokyo"
        )),
      activitiesCount: options?.activities?.length || 0,
      swipeData,
    });
  }, [
    currentRestaurantIndex,
    availableOptions,
    currentRestaurant,
    swipeData,
    options?.activities,
  ]);

  // Safety check - if no options are available, show loading or error state
  if (!availableOptions || availableOptions.length === 0) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View
            style={[
              styles.content,
              { justifyContent: "center", alignItems: "center" },
            ]}
          >
            <Text style={styles.errorText}>Loading options...</Text>
            <Text style={styles.errorSubtext}>
              Please wait while we prepare your recommendations
            </Text>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // API call to compose itinerary
  const composeItinerary = async () => {
    setIsComposingItinerary(true);
    try {
      console.log("🎯 Calling composeItinerary with:", {
        intake,
        options: {
          restaurants: options?.restaurants?.length || 0,
          activities: options?.activities?.length || 0,
          categories: options?.categories?.length || 0,
        },
        swipes: swipeData,
      });

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
        setSwipeData((prev) => ({
          ...prev,
          liked: allRestaurantIds,
          totalSwiped: allRestaurantIds.length,
        }));
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
      });
    } finally {
      setIsComposingItinerary(false);
    }
  };

  const showAlert = (direction: string) => {
    Alert.alert("Swipe Action", `You swiped ${direction}!`, [
      { text: "OK", style: "default" },
    ]);
  };

  const resetCard = () => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotate.value = withSpring(0);
    scale.value = withSpring(1);
    cardHeight.value = withSpring(CARD_HEIGHT);

    likeOpacity.value = 0;
    nopeOpacity.value = 0;
    flashOpacity.value = 0;
    nextCardScale.value = 0.96;
    nextCardRotate.value = 0;
    skewDeg.value = 0;

    newCardTranslateY.value = -screenHeight; // park above
  };

  const nextRestaurant = (swipeDirection: "like" | "dislike") => {
    const currentOption = availableOptions[currentRestaurantIndex];
    if (!currentOption) {
      console.error("No current option available");
      return;
    }

    // Handle both API data format and fallback hardcoded format
    const optionType = currentOption.type || currentOption.kind || "restaurant";
    const suffix = optionType === "activity" ? "-activity" : "-restaurant";
    const currentOptionId =
      currentOption.id?.toString() ||
      (currentOption.name || currentOption.title)
        ?.toLowerCase()
        .replace(/\s+/g, "-") + suffix ||
      `option-${currentRestaurantIndex}`;

    console.log(
      `Swiping ${swipeDirection} on ${optionType}:`,
      currentOptionId,
      `(${currentOption.title || currentOption.name})`
    );

    // Update swipe data
    setSwipeData((prev) => ({
      liked:
        swipeDirection === "like"
          ? [...prev.liked, currentOptionId]
          : prev.liked,
      disliked:
        swipeDirection === "dislike"
          ? [...prev.disliked, currentOptionId]
          : prev.disliked,
      totalSwiped: prev.totalSwiped + 1,
    }));

    const nextIndex = (currentRestaurantIndex + 1) % availableOptions.length;
    setCurrentRestaurantIndex(nextIndex);

    // Minimum swipes before allowing itinerary composition
    const minSwipesRequired = Math.max(
      5,
      Math.min(availableOptions.length, 10)
    );

    // Check if we've swiped enough and completed a cycle, or if we've swiped a lot
    const shouldComposeItinerary =
      (swipeData.totalSwiped >= minSwipesRequired &&
        nextIndex === 0 &&
        currentRestaurantIndex === availableOptions.length - 1) ||
      swipeData.totalSwiped >= availableOptions.length * 2 || // After 2 full cycles
      swipeData.totalSwiped >= 20; // Hard limit for very long lists

    if (shouldComposeItinerary && !isComposingItinerary) {
      console.log(
        `🎯 Composing itinerary after ${swipeData.totalSwiped} swipes (min required: ${minSwipesRequired})`
      );
      setTimeout(() => {
        if (!isComposingItinerary) {
          composeItinerary();
        }
      }, 1000); // Small delay to let the animation complete
    }

    // Prepare the next "next" card off-screen above
    newCardTranslateY.value = -screenHeight;
  };

  const collapseOverlay = () => {
    overlayHeight.value = withSpring(OVERLAY_COLLAPSED, {
      damping: 50,
      stiffness: 500,
    });
  };

  const prevRestaurant = () => {
    setCurrentRestaurantIndex(
      (prev) => (prev - 1 + restaurants.length) % restaurants.length
    );
    newCardTranslateY.value = -screenHeight;
  };

  // Horizontal pan to swipe the whole card stack
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // ignore tiny jitters; also reduces conflict with vertical drags
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = (event.translationX / CARD_WIDTH) * 20;
      // Add subtle scale effect during drag
      const dragProgress = Math.abs(event.translationX) / CARD_WIDTH;
      scale.value = 1 - dragProgress * 0.05; // Slight shrink as you drag

      // badge opacity follows horizontal drag
      const p = Math.min(1, Math.abs(event.translationX) / (CARD_WIDTH * 0.5));
      likeOpacity.value = event.translationX > 0 ? p : 0;
      nopeOpacity.value = event.translationX < 0 ? p : 0;

      // tease the next card slightly
      nextCardScale.value =
        0.96 +
        Math.min(0.03, (Math.abs(event.translationX) / CARD_WIDTH) * 0.04);
      nextCardRotate.value = (event.translationX / CARD_WIDTH) * 2; // tiny tilt
    })
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // RIGHT SWIPE
      if (translationX > 100 || velocityX > 500) {
        translateX.value = withSpring(screenWidth + 200, {
          damping: 18,
          stiffness: 320,
        });
        rotate.value = withSpring(25, { damping: 18, stiffness: 320 });
        scale.value = withSpring(0.88, { damping: 18, stiffness: 320 });
        skewDeg.value = withSpring(0);

        likeOpacity.value = withSpring(1); // snap badge fully visible

        // flash the backdrop quickly
        flashOpacity.value = 0;
        flashOpacity.value = withSpring(
          0.4,
          { damping: 18, stiffness: 300 },
          () => {
            flashOpacity.value = withSpring(0, { damping: 20, stiffness: 280 });
          }
        );

        // bring next card with bounce + slight overshoot scale
        setTimeout(() => {
          newCardTranslateY.value = withSpring(0, {
            damping: 24,
            stiffness: 420,
          });
          nextCardScale.value = withSpring(
            1.02,
            { damping: 22, stiffness: 380 },
            () => {
              nextCardScale.value = withSpring(1, {
                damping: 22,
                stiffness: 380,
              });
            }
          );
          nextCardRotate.value = withSpring(0, { damping: 20, stiffness: 360 });
        }, 120);

        runOnJS(nextRestaurant)("like");
        setTimeout(() => runOnJS(resetCard)(), 780);
      }
      // LEFT SWIPE
      else if (translationX < -100 || velocityX < -500) {
        translateX.value = withSpring(-screenWidth - 200, {
          damping: 18,
          stiffness: 320,
        });
        rotate.value = withSpring(-22, { damping: 18, stiffness: 320 });
        scale.value = withSpring(0.9, { damping: 18, stiffness: 320 });

        // dust trail skew as it leaves
        skewDeg.value = withSpring(-6, { damping: 18, stiffness: 320 });

        // show NOPE badge
        nopeOpacity.value = withSpring(1);

        // bring next card similarly
        setTimeout(() => {
          newCardTranslateY.value = withSpring(0, {
            damping: 24,
            stiffness: 420,
          });
          nextCardScale.value = withSpring(
            1.01,
            { damping: 22, stiffness: 380 },
            () => {
              nextCardScale.value = withSpring(1, {
                damping: 22,
                stiffness: 380,
              });
            }
          );
          nextCardRotate.value = withSpring(0, { damping: 20, stiffness: 360 });
        }, 120);

        runOnJS(nextRestaurant)("dislike");
        setTimeout(() => runOnJS(resetCard)(), 780);
      }
      // UP SWIPE -> keep as-is (alert), but don’t interfere with overlay pan
      else if (translationY < -100 || velocityY < -500) {
        translateY.value = withSpring(-screenHeight - 100);
        runOnJS(showAlert)("up");
        setTimeout(() => runOnJS(resetCard)(), 800);
      }
      // Return to center
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        scale.value = withSpring(1);
        likeOpacity.value = withSpring(0);
        nopeOpacity.value = withSpring(0);
        nextCardScale.value = withSpring(0.96);
        nextCardRotate.value = withSpring(0);
        skewDeg.value = withSpring(0);
      }
    });

  // Vertical pan for the overlay bottom sheet (no bounce)
  const overlayPan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onStart(() => {
      overlayDragStart.value = overlayHeight.value;
    })
    .onUpdate((e) => {
      // dragging up should increase overlay height
      const next = overlayDragStart.value - e.translationY;
      const clamped = Math.max(
        OVERLAY_COLLAPSED,
        Math.min(OVERLAY_EXPANDED, next)
      );
      overlayHeight.value = clamped;
    })
    .onEnd((e) => {
      const mid = (OVERLAY_COLLAPSED + OVERLAY_EXPANDED) / 2;
      const shouldExpand = e.velocityY < -400 || overlayHeight.value > mid;

      overlayHeight.value = withSpring(
        shouldExpand ? OVERLAY_EXPANDED : OVERLAY_COLLAPSED,
        { damping: 50, stiffness: 500 }
      );
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ] as any,
      height: cardHeight.value,
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return { height: overlayHeight.value };
  });

  const newCardAnimatedStyle = useAnimatedStyle(() => {
    return { transform: [{ translateY: newCardTranslateY.value }] as any };
  });

  // labels
  const likeStyle = useAnimatedStyle(() => ({
    opacity: likeOpacity.value,
    transform: [{ rotate: "-12deg" }],
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: nopeOpacity.value,
    transform: [{ rotate: "12deg" }],
  }));

  // backdrop flash for right-swipe success
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  // skew effect for left exit
  const skewStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
      // Reanimated v3 doesn't have direct skew helpers; use matrix via rotateZ small for hint
    ] as any,
  }));

  // polish for the 'next' card
  const newCardPolishStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: newCardTranslateY.value },
      { scale: nextCardScale.value },
      { rotate: `${nextCardRotate.value}deg` },
    ] as any,
  }));

  const nextIndex = (currentRestaurantIndex + 1) % availableOptions.length;

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="globe-outline"
                size={24}
                color={colors.accent}
                style={{ marginRight: 12 }}
              />
              <Text style={styles.headerTitle}>AiBnB</Text>
            </View>
            <View style={styles.headerRight}>
              {swipeData.totalSwiped >= 3 && (
                <TouchableOpacity
                  style={styles.composeButton}
                  onPress={() => {
                    if (!isComposingItinerary) {
                      composeItinerary();
                    }
                  }}
                  disabled={isComposingItinerary}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.surface}
                  />
                </TouchableOpacity>
              )}
              <View style={styles.filterButton}>
                <Ionicons
                  name="options-outline"
                  size={22}
                  color={colors.accent}
                />
              </View>
              <View style={styles.profileButton}>
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color={colors.accent}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Success flash layer */}
        <Animated.View
          pointerEvents="none"
          style={[styles.flash, flashStyle]}
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* New Card (appears from top) */}
          <Animated.View
            style={[
              styles.card,
              styles.newCard,
              newCardAnimatedStyle,
              newCardPolishStyle,
            ]}
          >
            <Image
              source={
                availableOptions[nextIndex]?.image ||
                restaurants[nextIndex]?.image ||
                require("../assets/images/swipe1.jpg") // Default fallback
              }
              style={styles.cardImage}
              resizeMode="cover"
            />
            <Animated.View
              style={[styles.cardOverlay, { height: OVERLAY_COLLAPSED }]}
            >
              <View style={styles.detailsContent}>
                <View style={styles.restaurantHeader}>
                  <View style={styles.titleRow}>
                    {/* Type indicator for next card */}
                    <View
                      style={[
                        styles.typeIndicator,
                        availableOptions[nextIndex]?.type === "activity"
                          ? styles.activityIndicator
                          : styles.restaurantIndicator,
                      ]}
                    >
                      <Ionicons
                        name={
                          availableOptions[nextIndex]?.type === "activity"
                            ? "compass-outline"
                            : "restaurant-outline"
                        }
                        size={14}
                        color={colors.surface}
                      />
                      <Text style={styles.typeText}>
                        {availableOptions[nextIndex]?.type === "activity"
                          ? "ACTIVITY"
                          : "DINING"}
                      </Text>
                    </View>
                    <Text style={styles.restaurantName}>
                      {availableOptions[nextIndex]?.title ||
                        availableOptions[nextIndex]?.name ||
                        restaurants[nextIndex]?.name ||
                        "Restaurant"}
                    </Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>
                      {(availableOptions[nextIndex]?.rating_hint
                        ? (
                            3.5 +
                            availableOptions[nextIndex].rating_hint * 1.5
                          ).toFixed(1)
                        : availableOptions[nextIndex]?.rating) ||
                        restaurants[nextIndex]?.rating ||
                        "4.5"}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Current Card */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, animatedStyle, skewStyle]}>
              <Image
                source={
                  currentRestaurant?.image ||
                  restaurants[currentRestaurantIndex]?.image ||
                  require("../assets/images/swipe1.jpg") // Default fallback
                }
                style={styles.cardImage}
                resizeMode="cover"
              />

              {/* LIKE / NOPE badges */}
              <View style={styles.badgeContainer}>
                <Animated.View
                  style={[styles.badge, styles.likeBadge, likeStyle]}
                >
                  <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                  <Text style={styles.badgeTextLike}>LIKE</Text>
                </Animated.View>

                <Animated.View
                  style={[styles.badge, styles.nopeBadge, nopeStyle]}
                >
                  <Ionicons name="close" size={32} color="#FFFFFF" />
                  <Text style={styles.badgeTextNope}>NOPE</Text>
                </Animated.View>
              </View>

              {/* Overlay bottom-sheet with its own vertical pan */}
              <GestureDetector gesture={overlayPan}>
                <Animated.View
                  style={[styles.cardOverlay, animatedOverlayStyle]}
                >
                  {/* Grab handle so users know it's draggable */}
                  <View style={styles.grabberContainer}>
                    <View style={styles.grabber} />
                    {/* Dropdown icon - only show when expanded */}
                    {isOverlayExpanded && (
                      <TouchableOpacity
                        onPress={collapseOverlay}
                        style={styles.dropdownButton}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={20}
                          color={colors.accent}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView
                    style={styles.detailsScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.detailsContent}
                    // critical: only allow scrolling when expanded
                    scrollEnabled={scrollEnabled}
                    // no bounces; no overscroll glow
                    bounces={false}
                    overScrollMode="never"
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                  >
                    <View style={styles.restaurantHeader}>
                      <View style={styles.titleRow}>
                        {/* Type indicator */}
                        <View
                          style={[
                            styles.typeIndicator,
                            currentRestaurant?.type === "activity"
                              ? styles.activityIndicator
                              : styles.restaurantIndicator,
                          ]}
                        >
                          <Ionicons
                            name={
                              currentRestaurant?.type === "activity"
                                ? "compass-outline"
                                : "restaurant-outline"
                            }
                            size={14}
                            color={colors.surface}
                          />
                          <Text style={styles.typeText}>
                            {currentRestaurant?.type === "activity"
                              ? "ACTIVITY"
                              : "DINING"}
                          </Text>
                        </View>
                        <Text style={styles.restaurantName}>
                          {currentRestaurant?.title ||
                            currentRestaurant?.name ||
                            restaurants[currentRestaurantIndex]?.name ||
                            "Restaurant"}
                        </Text>
                      </View>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>
                          {(currentRestaurant?.rating_hint
                            ? (
                                3.5 +
                                currentRestaurant.rating_hint * 1.5
                              ).toFixed(1)
                            : currentRestaurant?.rating) ||
                            restaurants[currentRestaurantIndex]?.rating ||
                            "4.5"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.restaurantDescription}>
                      {currentRestaurant?.description ||
                        restaurants[currentRestaurantIndex]?.description ||
                        (currentRestaurant?.type === "activity"
                          ? `Discover this amazing ${
                              currentRestaurant?.category || "activity"
                            } experience in ${
                              currentRestaurant?.city || "the city"
                            }.`
                          : `Experience authentic ${
                              currentRestaurant?.cuisine || "cuisine"
                            } at this highly-rated restaurant in ${
                              currentRestaurant?.city || "the city"
                            }.`)}
                    </Text>

                    <View style={styles.detailsSection}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color={colors.subtext}
                        />
                        <Text style={styles.detailText}>
                          {currentRestaurant?.city ||
                            restaurants[currentRestaurantIndex]?.address ||
                            "City location"}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name={
                            currentRestaurant?.type === "activity"
                              ? currentRestaurant?.category === "museum"
                                ? "library-outline"
                                : currentRestaurant?.category === "outdoor"
                                ? "leaf-outline"
                                : currentRestaurant?.category === "tour"
                                ? "walk-outline"
                                : currentRestaurant?.category === "shopping"
                                ? "storefront-outline"
                                : currentRestaurant?.category === "nightlife"
                                ? "wine-outline"
                                : currentRestaurant?.category === "class"
                                ? "school-outline"
                                : "star-outline"
                              : "restaurant-outline"
                          }
                          size={18}
                          color={colors.subtext}
                        />
                        <Text style={styles.detailText}>
                          {currentRestaurant?.type === "activity"
                            ? currentRestaurant?.category || "Activity"
                            : currentRestaurant?.cuisine ||
                              restaurants[currentRestaurantIndex]?.cuisine ||
                              "International"}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={colors.subtext}
                        />
                        <Text style={styles.detailText}>
                          {currentRestaurant?.type === "activity"
                            ? currentRestaurant?.est_duration_min
                              ? `${currentRestaurant.est_duration_min} minutes`
                              : "Duration varies"
                            : currentRestaurant?.meal_type
                            ? `Best for ${currentRestaurant.meal_type}`
                            : restaurants[currentRestaurantIndex]?.hours ||
                              "Open daily"}
                        </Text>
                      </View>

                      {currentRestaurant?.est_cost_per_person && (
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="card-outline"
                            size={18}
                            color={colors.subtext}
                          />
                          <Text style={styles.detailText}>
                            ~${currentRestaurant.est_cost_per_person} per person
                          </Text>
                        </View>
                      )}

                      {currentRestaurant?.type === "activity" &&
                        currentRestaurant?.ticket_required && (
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="ticket-outline"
                              size={18}
                              color={colors.subtext}
                            />
                            <Text style={styles.detailText}>
                              Ticket required
                            </Text>
                          </View>
                        )}
                    </View>

                    <View style={styles.featuresSection}>
                      <Text style={styles.sectionTitle}>Tags</Text>
                      <View style={styles.featuresGrid}>
                        {(
                          currentRestaurant?.tags ||
                          currentRestaurant?.features ||
                          restaurants[currentRestaurantIndex]?.features ||
                          []
                        ).map((feature, index) => (
                          <View key={index} style={styles.featureTag}>
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </Animated.View>
              </GestureDetector>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Loading overlay for itinerary composition */}
        {isComposingItinerary && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <Text style={styles.loadingTitle}>Creating Your Itinerary</Text>
              <Text style={styles.loadingSubtitle}>
                Analyzing your preferences and crafting the perfect trip...
              </Text>
              <View style={styles.loadingAnimation}>
                <Text style={styles.loadingDots}>•••</Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgTop,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.bgTop,
    borderBottomWidth: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  composeButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    padding: 10,
  },
  profileButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: 15,
    padding: 6,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: colors.bgTop,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  newCard: {
    position: "absolute",
    zIndex: 1,
  },
  cardImage: {
    width: "100%",
    height: "95%",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  grabberContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  grabber: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginBottom: 6,
  },
  dropdownButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    padding: 20,
    paddingBottom: 30,
  },
  restaurantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    marginRight: 12,
  },
  typeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  restaurantIndicator: {
    backgroundColor: colors.accent,
  },
  activityIndicator: {
    backgroundColor: "#10B981", // Green for activities
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.surface,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  restaurantDescription: {
    fontSize: 15,
    color: colors.subtext,
    lineHeight: 22,
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: colors.subtext,
    marginLeft: 12,
    flex: 1,
  },
  featuresSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureTag: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.accent,
  },
  flash: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#D1FAE5", // soft green flash
    zIndex: 2,
  },
  badgeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    pointerEvents: "none",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  likeBadge: {
    backgroundColor: "#10B981", // vibrant green
    borderColor: "#FFFFFF",
  },
  nopeBadge: {
    backgroundColor: "#EF4444", // vibrant red
    borderColor: "#FFFFFF",
  },
  badgeTextLike: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 18,
  },
  badgeTextNope: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 18,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    maxWidth: screenWidth - 60,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingAnimation: {
    alignItems: "center",
  },
  loadingDots: {
    fontSize: 24,
    color: colors.accent,
    fontWeight: "bold",
    letterSpacing: 4,
  },
});
