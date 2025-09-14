import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatScreenProps {
  navigation: any;
  route: any;
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { initialQuery } = route.params || {};

  useEffect(() => {
    if (initialQuery) {
      // Add initial user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: initialQuery,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages([userMessage]);

      // Add AI response after a delay
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Brewing something...",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }, 1000);
    }
  }, [initialQuery]);

  const onSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmed,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");

    // Add AI response after a delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Brewing something...",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const goBack = () => {
    navigation.goBack();
  };

  // Chat bubble component
  const ChatBubble = ({ message }: { message: Message }) => (
    <View style={styles.messageContainer}>
      <View
        style={[
          styles.chatBubble,
          message.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.chatText,
            message.isUser ? styles.userText : styles.aiText,
          ]}
        >
          {message.text}
        </Text>
      </View>
      {!message.isUser && message.text === "Brewing something..." && (
        <Pressable
          onPress={() => navigation.navigate("Loading")}
          style={styles.magicButton}
        >
          <Text style={styles.magicButtonText}>Start the magic</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.chatHeader}>
          <Pressable onPress={goBack} style={styles.backButton}>
            <Ionicons name="chevron-back-sharp" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.chatTitle}>Wanderlust Buddy</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </ScrollView>

        <View style={styles.chatInputContainer}>
          <View style={styles.chatInputWrapper}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask me about your trip..."
              placeholderTextColor={colors.placeholder}
              style={styles.chatInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={onSubmit}
              blurOnSubmit={false}
            />
            <Pressable onPress={onSubmit} style={styles.chatSendButton}>
              <Ionicons name="arrow-up" size={18} color={colors.surface} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgTop,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  // Chat interface styles
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    // paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  chatContent: {
    paddingVertical: 10,
    gap: 16,
  },
  messageContainer: {
    alignItems: "flex-start",
  },
  chatBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
    borderBottomRightRadius: 1,
    paddingHorizontal: 20,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
  },
  chatText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.surface,
  },
  aiText: {
    color: colors.text,
  },
  chatInputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgTop,
  },
  chatInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  chatInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  chatSendButton: {
    backgroundColor: colors.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  magicButton: {
    marginTop: 12,
    paddingHorizontal: 45,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  magicButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
});
