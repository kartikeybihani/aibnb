import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { runOnJS } from "react-native-worklets";

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

// Restaurant data
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
  const [isExpanded, setIsExpanded] = React.useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const cardHeight = useSharedValue(CARD_HEIGHT);
  const overlayHeight = useSharedValue(CARD_HEIGHT * 0.2);

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
    overlayHeight.value = withSpring(CARD_HEIGHT * 0.2);
    setIsExpanded(false);
  };

  const nextRestaurant = () => {
    setCurrentRestaurantIndex((prev) => (prev + 1) % restaurants.length);
    resetCard();
  };

  const prevRestaurant = () => {
    setCurrentRestaurantIndex(
      (prev) => (prev - 1 + restaurants.length) % restaurants.length
    );
    resetCard();
  };

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const scrollY = contentOffset.y;

    if (scrollY > 20 && !isExpanded) {
      setIsExpanded(true);
      overlayHeight.value = withSpring(screenHeight * 0.6, {
        damping: 20,
        stiffness: 300,
      });
    } else if (scrollY <= 20 && isExpanded) {
      setIsExpanded(false);
      overlayHeight.value = withSpring(CARD_HEIGHT * 0.2, {
        damping: 20,
        stiffness: 300,
      });
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = (event.translationX / CARD_WIDTH) * 20;
    })
    .onEnd((event) => {
      const { translationX, translationY, velocityX, velocityY } = event;

      // Check for right swipe
      if (translationX > 100 || velocityX > 500) {
        translateX.value = withSpring(screenWidth + 100);
        rotate.value = withSpring(30);
        runOnJS(prevRestaurant)();
        setTimeout(() => runOnJS(resetCard)(), 1000);
      }
      // Check for left swipe
      else if (translationX < -100 || velocityX < -500) {
        translateX.value = withSpring(-screenWidth - 100);
        rotate.value = withSpring(-30);
        runOnJS(nextRestaurant)();
        setTimeout(() => runOnJS(resetCard)(), 1000);
      }
      // Check for up swipe
      else if (translationY < -100 || velocityY < -500) {
        translateY.value = withSpring(-screenHeight - 100);
        runOnJS(showAlert)("up");
        setTimeout(() => runOnJS(resetCard)(), 1000);
      }
      // Return to center
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
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
    return {
      height: overlayHeight.value,
    };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="globe-outline" size={24} color={colors.accent} />
              <Text style={styles.headerTitle}>AiBnB</Text>
            </View>
            <Ionicons name="filter-outline" size={26} color={colors.text} />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, animatedStyle]}>
              <Image
                source={currentRestaurant.image}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <Animated.View style={[styles.cardOverlay, animatedOverlayStyle]}>
                <ScrollView
                  style={styles.detailsScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.detailsContent}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
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
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.5,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
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
