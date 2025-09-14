import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Color tokens
const colors = {
  bgTop: "#FFF8F2",
  bgBot: "#FFE8D6",
  surface: "#FFFFFF",
  text: "#0F172A",
  subtext: "#475569",
  accent: "#FF6B3D", // coral
  accentSoft: "#FFD8C7",
  border: "#F2E8DF",
  placeholder: "#9AA4B2",
  shadow: "rgba(255,107,61,0.25)",
};

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const [query, setQuery] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

  const onSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Navigate to chat screen with the query
    navigation.navigate("Chat", { initialQuery: trimmed });
  };

  const handleContentSizeChange = (event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const newHeight = Math.max(40, Math.min(150, contentHeight + 20));
    setInputHeight(newHeight);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header text - centered */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Plan your next getaway</Text>
              <Text style={styles.subtitle}>
                Tell me where, how long, who is coming, and your vibe
              </Text>
            </View>

            {/* Search section */}
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <View
                  style={[
                    styles.searchInputWrapper,
                    { minHeight: inputHeight + 4 },
                  ]}
                >
                  <View style={styles.searchIconContainer}>
                    <Ionicons
                      name="search"
                      size={20}
                      color={colors.placeholder}
                    />
                  </View>
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="So where are we going today?"
                    placeholderTextColor={colors.placeholder}
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                    multiline={true}
                    onContentSizeChange={handleContentSizeChange}
                    style={[styles.searchInput, { height: inputHeight }]}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Primary CTA button */}
              <View style={styles.buttonContainer}>
                <Pressable
                  onPress={onSubmit}
                  style={({ pressed }) => [
                    styles.magicButton,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.magicButtonText}>Make magic</Text>
                </Pressable>
              </View>
            </View>

            {/* Preset tags - centered */}
            <View style={styles.presetSection}>
              <View style={styles.presetRow}>
                {[
                  "Tokyo 5 days",
                  "Paris weekend",
                  "Bali chill",
                  "NYC foodie",
                  "London culture",
                ].map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => setQuery(tag)}
                    style={styles.pill}
                  >
                    <Text style={styles.pillText}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Trust indicator - at bottom */}
          <View style={styles.trustSection}>
            <View style={styles.trustRow}>
              <View style={styles.dot} />
              <Text style={styles.trustText}>
                No sign in needed to try a plan
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.8,
    marginBottom: 8,
    fontFamily: "System",
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    fontWeight: "500",
    marginBottom: 16,
  },
  searchSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 40,
  },
  searchContainer: {
    width: "100%",
    marginBottom: 16,
  },
  searchInputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
    padding: 2,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  searchIconContainer: {
    paddingLeft: 15,
    paddingRight: 5,
    paddingTop: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingRight: 20,
    paddingVertical: 12,
    fontWeight: "500",
    minHeight: 40,
    backgroundColor: colors.surface,
    borderRadius: 14,
    flex: 1,
  },
  buttonContainer: {
    width: "50%",
    alignSelf: "center",
    marginBottom: 16,
  },
  magicButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  magicButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  presetSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  pillText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  trustSection: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentSoft,
  },
  trustText: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: "500",
  },
});
