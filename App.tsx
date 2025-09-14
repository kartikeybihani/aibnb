import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import ChatScreen from "./screens/ChatScreen";
import LoadingScreen from "./screens/LoadingScreen";
import SwipeScreen from "./screens/SwipeScreen";
import WelcomeScreen from "./screens/WelcomeScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{
            title: "Welcome",
          }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: "Chat",
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{
            title: "Loading",
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="SwipeScreen"
          component={SwipeScreen}
          options={{
            title: "SwipeScreen",
            gestureDirection: "horizontal",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
