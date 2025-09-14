import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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
  glass: "rgba(255, 255, 255, 0.25)",
  glassBorder: "rgba(255, 255, 255, 0.18)",
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ItineraryScreenProps {
  navigation: any;
  route: any;
}

// Sample 5-day Italy itinerary data
const itinerary = [
  {
    day: 1,
    city: "Milan",
    date: "Day 1 - Arrival",
    title: "Welcome to Milan",
    activities: [
      {
        time: "10:00 AM",
        icon: "airplane",
        title: "Arrive at Malpensa Airport",
        description:
          "Land at Milan Malpensa Airport, collect luggage, and take the Malpensa Express train to Milano Centrale (45 minutes)",
        details: [
          "Train ticket: €13",
          "Travel time: 45 minutes",
          "Frequency: Every 30 minutes",
        ],
      },
      {
        time: "12:00 PM",
        icon: "bed",
        title: "Check-in at Hotel",
        description:
          "Check into your boutique hotel near Brera District - perfect location for exploring Milan's art scene",
        details: [
          "Hotel: Brera Boutique",
          "Address: Via Brera 28",
          "Rating: 4.8/5",
        ],
      },
      {
        time: "2:00 PM",
        icon: "restaurant",
        title: "Lunch at Luini",
        description:
          "Famous panzerotti shop - a Milanese tradition. Try the classic mozzarella and tomato",
        details: ["Must-try: Panzerotti", "Price: €3-5 each", "Cash only"],
      },
      {
        time: "4:00 PM",
        icon: "camera",
        title: "Explore Duomo & Galleria",
        description:
          "Visit the magnificent Duomo Cathedral and walk through the elegant Galleria Vittorio Emanuele II",
        details: [
          "Duomo entry: €3-15",
          "Galleria: Free",
          "Dress code: Covered shoulders",
        ],
      },
      {
        time: "7:00 PM",
        icon: "wine",
        title: "Aperitivo at Terrazza Aperol",
        description:
          "Enjoy Milan's famous aperitivo tradition with stunning rooftop views",
        details: [
          "Location: Terrazza Aperol",
          "Price: €12-18",
          "Best sunset spot",
        ],
      },
    ],
    accommodation: "Brera Boutique Hotel",
    transport: "Walking & Metro",
  },
  {
    day: 2,
    city: "Milan",
    date: "Day 2 - Art & Culture",
    title: "Milan's Cultural Heart",
    activities: [
      {
        time: "9:00 AM",
        icon: "museum",
        title: "Last Supper Tour",
        description:
          "Early morning visit to Leonardo da Vinci's masterpiece - book in advance!",
        details: ["Booking required", "Duration: 15 minutes", "Price: €15"],
      },
      {
        time: "11:00 AM",
        icon: "library",
        title: "Brera Art Gallery",
        description:
          "Explore one of Italy's finest art collections including works by Caravaggio and Raphael",
        details: ["Entry: €15", "Audio guide: €5", "Duration: 2-3 hours"],
      },
      {
        time: "1:30 PM",
        icon: "restaurant",
        title: "Lunch at Pasta Fresca",
        description:
          "Authentic fresh pasta in Brera district - try the truffle ravioli",
        details: ["Specialty: Fresh pasta", "Price: €15-25", "Local favorite"],
      },
      {
        time: "3:30 PM",
        icon: "shirt",
        title: "Fashion District",
        description:
          "Stroll through Quadrilatero della Moda - Milan's luxury shopping district",
        details: [
          "Via Montenapoleone",
          "High-end boutiques",
          "Window shopping",
        ],
      },
      {
        time: "6:00 PM",
        icon: "train",
        title: "Prepare for Venice",
        description:
          "Return to hotel, pack, and get ready for tomorrow's journey to Venice",
        details: ["Pack light", "Check train schedule", "Early dinner"],
      },
    ],
    accommodation: "Brera Boutique Hotel",
    transport: "Walking & Metro",
  },
  {
    day: 3,
    city: "Venice",
    date: "Day 3 - Floating City",
    title: "Welcome to Venice",
    activities: [
      {
        time: "8:00 AM",
        icon: "train",
        title: "Train to Venice",
        description:
          "Take the high-speed train from Milan to Venice (2.5 hours) - book window seat!",
        details: ["Duration: 2h 30min", "Price: €25-45", "Book in advance"],
      },
      {
        time: "11:00 AM",
        icon: "boat",
        title: "Vaporetto to Hotel",
        description:
          "Take the water bus (vaporetto) to your hotel in San Marco district",
        details: [
          "Vaporetto ticket: €7.50",
          "Duration: 45 minutes",
          "Line 1 or 2",
        ],
      },
      {
        time: "12:30 PM",
        icon: "bed",
        title: "Check-in at Palazzo",
        description:
          "Check into your charming palazzo hotel overlooking a quiet canal",
        details: [
          "Hotel: Palazzo Venart",
          "Location: San Marco",
          "Canal view room",
        ],
      },
      {
        time: "2:00 PM",
        icon: "restaurant",
        title: "Lunch at Osteria alle Testiere",
        description:
          "Tiny seafood restaurant with incredible fresh fish - book ahead!",
        details: [
          "Specialty: Seafood",
          "Price: €35-50",
          "Reservation essential",
        ],
      },
      {
        time: "4:00 PM",
        icon: "map",
        title: "St. Mark's Square",
        description:
          "Explore the heart of Venice - St. Mark's Basilica and Doge's Palace",
        details: [
          "Basilica: Free entry",
          "Doge's Palace: €25",
          "Skip-the-line tickets",
        ],
      },
      {
        time: "7:00 PM",
        icon: "wine",
        title: "Gondola Ride at Sunset",
        description:
          "Romantic gondola ride through Venice's canals as the sun sets",
        details: ["Price: €80-100", "Duration: 30 minutes", "Private tour"],
      },
    ],
    accommodation: "Palazzo Venart",
    transport: "Train & Vaporetto",
  },
  {
    day: 4,
    city: "Venice",
    date: "Day 4 - Islands & Art",
    title: "Venetian Islands",
    activities: [
      {
        time: "9:00 AM",
        icon: "boat",
        title: "Murano Island",
        description:
          "Visit the glass-making island - watch master artisans create beautiful glass art",
        details: [
          "Vaporetto: Line 12",
          "Duration: 30 minutes",
          "Glass factory tours",
        ],
      },
      {
        time: "11:00 AM",
        icon: "color-palette",
        title: "Burano Island",
        description:
          "Colorful fishing village famous for lace-making and rainbow houses",
        details: [
          "Vaporetto: Line 12",
          "Duration: 45 minutes",
          "Photo opportunities",
        ],
      },
      {
        time: "1:00 PM",
        icon: "restaurant",
        title: "Lunch on Burano",
        description:
          "Fresh seafood lunch at Trattoria al Gatto Nero - try the risotto di gò",
        details: [
          "Specialty: Risotto",
          "Price: €25-40",
          "Local recommendation",
        ],
      },
      {
        time: "3:00 PM",
        icon: "boat",
        title: "Return to Venice",
        description:
          "Take the vaporetto back to Venice and explore hidden corners",
        details: ["Vaporetto return", "Duration: 1 hour", "Relax on deck"],
      },
      {
        time: "5:00 PM",
        icon: "library",
        title: "Accademia Gallery",
        description:
          "Visit Venice's premier art museum with works by Bellini, Titian, and Tintoretto",
        details: ["Entry: €15", "Audio guide: €6", "Duration: 2 hours"],
      },
      {
        time: "8:00 PM",
        icon: "restaurant",
        title: "Dinner at Osteria da Fiore",
        description:
          "Michelin-starred restaurant for a special Venetian dining experience",
        details: ["Michelin star", "Price: €80-120", "Reservation required"],
      },
    ],
    accommodation: "Palazzo Venart",
    transport: "Vaporetto",
  },
  {
    day: 5,
    city: "Florence",
    date: "Day 5 - Renaissance City",
    title: "Florence & Departure",
    activities: [
      {
        time: "8:00 AM",
        icon: "train",
        title: "Train to Florence",
        description:
          "High-speed train from Venice to Florence (2 hours) through beautiful countryside",
        details: ["Duration: 2 hours", "Price: €35-55", "Scenic route"],
      },
      {
        time: "10:30 AM",
        icon: "bed",
        title: "Hotel Check-in",
        description:
          "Check into your hotel near the Duomo - drop bags and freshen up",
        details: [
          "Hotel: Hotel Brunelleschi",
          "Location: Piazza Duomo",
          "Central location",
        ],
      },
      {
        time: "11:30 AM",
        icon: "library",
        title: "Uffizi Gallery",
        description:
          "World's greatest collection of Renaissance art - Botticelli, Michelangelo, and more",
        details: ["Entry: €20", "Skip-the-line: €4", "Duration: 3-4 hours"],
      },
      {
        time: "2:30 PM",
        icon: "restaurant",
        title: "Lunch at All'Antico Vinaio",
        description:
          "Famous sandwich shop - try the La Boss with truffle cream and prosciutto",
        details: ["Famous: Panini", "Price: €8-12", "Long queue expected"],
      },
      {
        time: "4:00 PM",
        icon: "camera",
        title: "Duomo & Ponte Vecchio",
        description:
          "Visit Florence Cathedral and walk across the historic Ponte Vecchio bridge",
        details: [
          "Duomo: Free entry",
          "Climb dome: €18",
          "Ponte Vecchio: Free",
        ],
      },
      {
        time: "6:00 PM",
        icon: "airplane",
        title: "Departure",
        description:
          "Head to Florence Airport for your departure flight - end of an amazing Italian journey!",
        details: ["Airport: FLR", "Taxi: €25-35", "Duration: 30 minutes"],
      },
    ],
    accommodation: "Hotel Brunelleschi",
    transport: "Train & Taxi",
  },
];

export default function ItineraryScreen({
  navigation,
  route,
}: ItineraryScreenProps) {
  const fadeInValue = useSharedValue(0);
  const slideUpValue = useSharedValue(30);

  // Get itinerary data from route params
  const { itinerary: dynamicItinerary, meta, error } = route.params || {};

  // Use dynamic itinerary if available, otherwise fallback to hardcoded data
  const itineraryData = dynamicItinerary || {
    title: "Your Amazing Trip",
    summary: "A carefully crafted itinerary based on your preferences",
    totalDays: 5,
    cities: ["Milan", "Venice", "Florence"],
    days: itinerary, // Use hardcoded data as fallback
    estimatedCost: {
      total: 1500,
      perPerson: 750,
      currency: "USD",
    },
  };

  useEffect(() => {
    fadeInValue.value = withTiming(1, { duration: 800 });
    slideUpValue.value = withTiming(0, { duration: 800 });
  }, []);

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
    transform: [{ translateY: slideUpValue.value }],
  }));

  const renderActivityCard = (activity: any, index: number) => {
    const cardOpacity = useSharedValue(0);
    const cardSlide = useSharedValue(20);

    useEffect(() => {
      cardOpacity.value = withDelay(
        index * 100,
        withTiming(1, { duration: 600 })
      );
      cardSlide.value = withDelay(
        index * 100,
        withTiming(0, { duration: 600 })
      );
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardOpacity.value,
      transform: [{ translateY: cardSlide.value }],
    }));

    // Map activity type to icon
    const getActivityIcon = (type: string) => {
      switch (type) {
        case "restaurant":
          return "restaurant";
        case "activity":
          return "walk";
        case "transport":
          return "train";
        case "accommodation":
          return "bed";
        default:
          return "location";
      }
    };

    return (
      <Animated.View key={index} style={[styles.activityCard, cardStyle]}>
        <View style={styles.activityHeader}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{activity.time}</Text>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getActivityIcon(activity.type) as any}
              size={24}
              color={colors.accent}
            />
          </View>
        </View>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDescription}>
          {activity.description || activity.notes || "Activity details"}
        </Text>
        <View style={styles.detailsContainer}>
          {activity.location && (
            <View style={styles.detailItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.detailText}>
                Location: {activity.location}
              </Text>
            </View>
          )}
          {activity.duration && (
            <View style={styles.detailItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.detailText}>
                Duration: {activity.duration}
              </Text>
            </View>
          )}
          {activity.notes && activity.notes !== activity.description && (
            <View style={styles.detailItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.detailText}>{activity.notes}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderDayCard = (dayData: any, index: number) => {
    const cardOpacity = useSharedValue(0);
    const cardSlide = useSharedValue(30);

    useEffect(() => {
      cardOpacity.value = withDelay(
        index * 200,
        withTiming(1, { duration: 800 })
      );
      cardSlide.value = withDelay(
        index * 200,
        withSpring(0, { damping: 15, stiffness: 100 })
      );
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardOpacity.value,
      transform: [{ translateY: cardSlide.value }],
    }));

    return (
      <Animated.View key={index} style={[styles.dayCard, cardStyle]}>
        {/* Glassmorphism Header */}
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderTop}>
            <View style={styles.dayHeaderLeft}>
              <View style={styles.dayNumberContainer}>
                <Text style={styles.dayNumber}>{dayData.day}</Text>
              </View>
              <View style={styles.dayInfo}>
                <Text style={styles.dayDate}>
                  {dayData.date || `Day ${dayData.day}`}
                </Text>
                <Text style={styles.dayTitle}>
                  {dayData.title || `Day ${dayData.day} in ${dayData.city}`}
                </Text>
                <Text style={styles.cityName}>{dayData.city}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                // Handle edit functionality
                console.log(`Edit day ${dayData.day}`);
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.dayStats}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={16} color={colors.accent} />
              <Text style={styles.statText}>{dayData.city}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color={colors.accent} />
              <Text style={styles.statText}>
                {dayData.activities?.length || 0} activities
              </Text>
            </View>
          </View>
        </View>

        {/* Activities */}
        <View style={styles.activitiesContainer}>
          {dayData.activities?.map((activity: any, activityIndex: number) =>
            renderActivityCard(activity, activityIndex)
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, fadeInStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{itineraryData.title}</Text>
          <Text style={styles.headerSubtitle}>
            {itineraryData.totalDays} Days • {itineraryData.cities?.length || 0}{" "}
            Cities • Unforgettable
          </Text>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </Animated.View>

      {/* Itinerary Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={fadeInStyle}>
          <Text style={styles.introText}>{itineraryData.summary}</Text>
        </Animated.View>

        {error && (
          <Animated.View style={[styles.errorCard, fadeInStyle]}>
            <Text style={styles.errorText}>
              There was an issue generating your itinerary: {error}
            </Text>
            <Text style={styles.errorSubtext}>
              Here's a sample itinerary to get you started!
            </Text>
          </Animated.View>
        )}

        {itineraryData.days?.map((dayData, index) =>
          renderDayCard(dayData, index)
        )}

        {/* Summary Card */}
        <Animated.View style={[styles.summaryCard, fadeInStyle]}>
          <Text style={styles.summaryTitle}>Trip Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar" size={20} color={colors.accent} />
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>
                {itineraryData.totalDays} Days
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="location" size={20} color={colors.accent} />
              <Text style={styles.summaryLabel}>Cities</Text>
              <Text style={styles.summaryValue}>
                {itineraryData.cities?.length || 0} Cities
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="card" size={20} color={colors.accent} />
              <Text style={styles.summaryLabel}>Est. Cost</Text>
              <Text style={styles.summaryValue}>
                {itineraryData.estimatedCost?.currency || "USD"}{" "}
                {itineraryData.estimatedCost?.perPerson || 0}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="star" size={20} color={colors.accent} />
              <Text style={styles.summaryLabel}>Experience</Text>
              <Text style={styles.summaryValue}>Unforgettable</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgTop,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.bgTop,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 16,
    color: colors.subtext,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  dayCard: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  dayHeader: {
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayNumberContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.surface,
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 14,
    color: colors.subtext,
    fontWeight: "500",
    marginBottom: 4,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  cityName: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: "600",
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayStats: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: colors.subtext,
    fontWeight: "500",
  },
  activitiesContainer: {
    padding: 20,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeContainer: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.subtext,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  detailText: {
    fontSize: 12,
    color: colors.subtext,
    flex: 1,
    lineHeight: 16,
  },
  summaryCard: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  errorCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  errorText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 12,
    color: colors.subtext,
    textAlign: "center",
  },
});
