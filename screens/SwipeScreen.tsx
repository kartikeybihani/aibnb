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

  const nextRestaurant = () => {
    const nextIndex = (currentRestaurantIndex + 1) % restaurants.length;
    setCurrentRestaurantIndex(nextIndex);

    // Check if we've completed all restaurants (cycled back to 0)
    if (nextIndex === 0 && currentRestaurantIndex === restaurants.length - 1) {
      // All restaurants exhausted, navigate to loading screen
      setTimeout(() => {
        navigation.navigate("ItineraryLoading");
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

        runOnJS(nextRestaurant)();
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

        runOnJS(nextRestaurant)();
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
            <Animated.View style={[styles.card, animatedStyle, skewStyle]}>
              <Image
                source={currentRestaurant.image}
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
});
