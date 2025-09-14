import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Color tokens
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

interface LoadingScreenProps {
  navigation: any;
}

const loadingMessages = [
  "Setting up things for you now...",
  "Carving out the best experience for you!",
  "You've got a great taste...",
  "Crafting something special...",
  "Almost ready to amaze you...",
  "Preparing your personalized journey...",
  "Fine-tuning every detail...",
  "Creating magic just for you...",
  "Building your perfect moment...",
  "Almost there, stay tuned...",
];

export default function LoadingScreen({ navigation }: LoadingScreenProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Navigate to SwipeScreen after 5 seconds
    const navigationTimer = setTimeout(() => {
      navigation.navigate("SwipeScreen");
    }, 3500);

    const messageInterval = setInterval(() => {
      // Fade out current message
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change message
        setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);

        // Reset slide position
        slideAnim.setValue(20);

        // Fade in new message
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2500);

    // Continuous dot animations with staggered timing
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1Animation = createDotAnimation(dotAnim1, 0);
    const dot2Animation = createDotAnimation(dotAnim2, 200);
    const dot3Animation = createDotAnimation(dotAnim3, 400);

    dot1Animation.start();
    dot2Animation.start();
    dot3Animation.start();

    return () => {
      clearTimeout(navigationTimer);
      clearInterval(messageInterval);
      dot1Animation.stop();
      dot2Animation.stop();
      dot3Animation.stop();
    };
  }, [fadeAnim, slideAnim, dotAnim1, dotAnim2, dotAnim3]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          {/* Glassmorphism Box */}
          <View style={styles.glassContainer}>
            <BlurView intensity={20} style={styles.blurView}>
              <View style={styles.glassBox}>
                {/* Main loading text */}
                <Animated.View
                  style={[
                    styles.textContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <Text style={styles.loadingText} numberOfLines={2}>
                    {loadingMessages[currentMessageIndex]}
                  </Text>
                </Animated.View>

                {/* Progress dots */}
                <View style={styles.dotsContainer}>
                  <Animated.View
                    style={[
                      styles.dot,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            scale: dotAnim1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.dot,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            scale: dotAnim2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.dot,
                      {
                        opacity: fadeAnim,
                        transform: [
                          {
                            scale: dotAnim3.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1.2],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgTop,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  glassContainer: {
    width: Math.min(340, screenWidth - 48),
    height: 140,
    borderRadius: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  blurView: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  glassBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    position: "relative",
  },
  textContainer: {
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadingText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: 18,
    maxWidth: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});
