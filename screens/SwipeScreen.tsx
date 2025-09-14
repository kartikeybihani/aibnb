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
}

export default function SwipeScreen({ navigation }: SwipeScreenProps) {
  const [currentRestaurantIndex, setCurrentRestaurantIndex] = React.useState(0);

  // Card transforms
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const cardHeight = useSharedValue(CARD_HEIGHT);

  // "Next" card starts above the screen; we drop it in from the top.
  const newCardTranslateY = useSharedValue(-screenHeight);

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

  const currentRestaurant = restaurants[currentRestaurantIndex];

  const showAlert = (direction: string) => {
    Alert.alert("Swipe Action", `You swiped ${direction}!`, [
      { text: "OK", style: "default" },
    ]);
  };

  const resetCard = () => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotate.value = withSpring(0);
    cardHeight.value = withSpring(CARD_HEIGHT);
    // keep overlay where the user left it (no forced collapse)
    newCardTranslateY.value = -screenHeight; // park above for next reveal
  };

  const nextRestaurant = () => {
    setCurrentRestaurantIndex((prev) => (prev + 1) % restaurants.length);
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
    })
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // RIGHT SWIPE -> fling current off to RIGHT, bring NEXT from TOP
      if (translationX > 100 || velocityX > 500) {
        translateX.value = withSpring(screenWidth + 160, {
          damping: 15,
          stiffness: 220,
        });
        rotate.value = withSpring(18, { damping: 15, stiffness: 220 });

        // drop the prepared "next" card from the top
        newCardTranslateY.value = withSpring(0, {
          damping: 18,
          stiffness: 300,
        });

        runOnJS(nextRestaurant)();
        setTimeout(() => runOnJS(resetCard)(), 600);
      }
      // LEFT SWIPE -> fling current off to LEFT, bring NEXT from TOP (same behavior)
      else if (translationX < -100 || velocityX < -500) {
        translateX.value = withSpring(-screenWidth - 160, {
          damping: 15,
          stiffness: 220,
        });
        rotate.value = withSpring(-18, { damping: 15, stiffness: 220 });

        newCardTranslateY.value = withSpring(0, {
          damping: 18,
          stiffness: 300,
        });

        runOnJS(nextRestaurant)();
        setTimeout(() => runOnJS(resetCard)(), 600);
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

  const nextIndex = (currentRestaurantIndex + 1) % restaurants.length;

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

        {/* Main Content */}
        <View style={styles.content}>
          {/* New Card (appears from top) */}
          <Animated.View
            style={[styles.card, styles.newCard, newCardAnimatedStyle]}
          >
            <Image
              source={restaurants[nextIndex].image}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <Animated.View
              style={[styles.cardOverlay, { height: OVERLAY_COLLAPSED }]}
            >
              <View style={styles.detailsContent}>
                <View style={styles.restaurantHeader}>
                  <Text style={styles.restaurantName}>
                    {restaurants[nextIndex].name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>
                      {restaurants[nextIndex].rating}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Current Card */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, animatedStyle]}>
              <Image
                source={currentRestaurant.image}
                style={styles.cardImage}
                resizeMode="cover"
              />

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
                      <Text style={styles.restaurantName}>
                        {currentRestaurant.name}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>
                          {currentRestaurant.rating}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.restaurantDescription}>
                      {currentRestaurant.description}
                    </Text>

                    <View style={styles.detailsSection}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color={colors.subtext}
                        />
                        <Text style={styles.detailText}>
                          {currentRestaurant.phone}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color={colors.subtext}
                        />
                        <Text style={styles.detailText}>
                          {currentRestaurant.address}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={colors.subtext}
                        />
                        <Text style={styles.detailText}>
                          {currentRestaurant.hours}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="restaurant-outline"
                          size={18}
                          color={colors.subtext}
                        />
                        <Text style={styles.detailText}>
                          {currentRestaurant.cuisine}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.featuresSection}>
                      <Text style={styles.sectionTitle}>Features</Text>
                      <View style={styles.featuresGrid}>
                        {currentRestaurant.features.map((feature, index) => (
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
    alignItems: "center",
    marginBottom: 12,
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
});
