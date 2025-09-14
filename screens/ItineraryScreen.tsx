import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, styles } from "./ItineraryScreen.styles";
import MapModal from "./MapModal";

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

  // State for modal and dropdown
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [editQuery, setEditQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  // Animation values for summary expansion
  const summaryHeight = useSharedValue(0);
  const summaryOpacity = useSharedValue(0);

  // Get itinerary data from route params
  const {
    itinerary: dynamicItinerary,
    meta,
    error,
    intake,
    options, // Add options to get original coordinate data
  } = route.params || {};

  // Use dynamic itinerary if available, otherwise fallback to hardcoded data
  const itineraryData = dynamicItinerary || {
    title: error
      ? "Sample Itinerary"
      : intake?.destinations?.[0]?.city
      ? `Your ${intake.destinations[0].city} Adventure`
      : "Your Amazing Trip",
    summary: error
      ? "This is a sample itinerary. We encountered an issue generating your personalized trip."
      : "A carefully crafted itinerary based on your preferences",
    totalDays: intake?.trip_length_days || 5,
    cities: intake?.destinations?.map((d) => d.city) || [
      "Milan",
      "Venice",
      "Florence",
    ],
    days: itinerary, // Use hardcoded data as fallback
    estimatedCost: {
      total:
        (intake?.trip_length_days || 5) * 300 * (intake?.party?.adults || 2),
      perPerson: (intake?.trip_length_days || 5) * 300,
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

  const summaryAnimatedStyle = useAnimatedStyle(() => ({
    height: summaryHeight.value,
    opacity: summaryOpacity.value,
  }));

  const toggleSummary = () => {
    setIsSummaryExpanded(!isSummaryExpanded);
    if (!isSummaryExpanded) {
      summaryHeight.value = withTiming(120, { duration: 400 });
      summaryOpacity.value = withTiming(1, { duration: 300 });
    } else {
      summaryHeight.value = withTiming(0, { duration: 350 });
      summaryOpacity.value = withTiming(0, { duration: 200 });
    }
  };

  const renderActivityCard = (activity: any, index: number) => {
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
      <View key={index} style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{activity.time}</Text>
          </View>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getActivityIcon(activity.type) as any}
              size={21}
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
      </View>
    );
  };

  const renderDayCard = (dayData: any, index: number) => {
    return (
      <View key={index} style={styles.dayCard}>
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
                setSelectedDay(dayData.day);
                setIsEditModalVisible(true);
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, fadeInStyle]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{itineraryData.title}</Text>
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
        {/* Glassmorphism Summary Box */}
        <Animated.View style={[styles.summaryGlassBox, fadeInStyle]}>
          <TouchableOpacity
            style={styles.summaryHeaderNew}
            onPress={toggleSummary}
          >
            <View style={styles.summaryHeaderContent}>
              <View style={styles.summaryHeaderLeft}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <Text style={styles.tripInfoInSummary}>
                  {itineraryData.totalDays} Days •{" "}
                  {itineraryData.cities?.length || 0} Cities • Unforgettable
                </Text>
              </View>
              <Ionicons
                name={isSummaryExpanded ? "chevron-up" : "chevron-forward"}
                size={20}
                color={colors.accent}
              />
            </View>
          </TouchableOpacity>

          <Animated.View
            style={[styles.summaryExpandedContent, summaryAnimatedStyle]}
          >
            <Text style={styles.summaryTextNew}>{itineraryData.summary}</Text>
          </Animated.View>
        </Animated.View>

        {/* Map Button */}
        <Animated.View style={[styles.mapButtonContainer, fadeInStyle]}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => setIsMapModalVisible(true)}
          >
            <View style={styles.mapButtonContent}>
              <Ionicons name="map" size={24} color={colors.surface} />
              <Text style={styles.mapButtonText}>View on Map</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.surface} />
          </TouchableOpacity>
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

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? -15 : 20}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalBackButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Day {selectedDay}</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Chat Container */}
            <ScrollView
              style={styles.modalChatContainer}
              contentContainerStyle={styles.modalChatContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalWelcome}>
                <Text style={styles.modalWelcomeText}>
                  What you'd like to change about Day {selectedDay}!
                </Text>
              </View>
            </ScrollView>

            {/* Input Container */}
            <View style={styles.modalInputContainer}>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  value={editQuery}
                  onChangeText={setEditQuery}
                  placeholder="What would you like to change?"
                  placeholderTextColor={colors.placeholder}
                  style={styles.modalInput}
                  multiline
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    // Handle submit
                    console.log("Edit request:", editQuery);
                    setEditQuery("");
                  }}
                  blurOnSubmit={true}
                />
                <TouchableOpacity
                  onPress={() => {
                    // Handle submit
                    console.log("Edit request:", editQuery);
                    setEditQuery("");
                  }}
                  style={styles.modalSendButton}
                >
                  <Ionicons name="arrow-up" size={18} color={colors.surface} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Map Modal */}
      <MapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        itineraryData={itineraryData}
        options={options}
      />
    </SafeAreaView>
  );
}
