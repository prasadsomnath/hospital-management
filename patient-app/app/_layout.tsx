import React, { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { LogBox, View, StyleSheet, Platform } from "react-native";
LogBox.ignoreLogs(["props.pointerEvents is deprecated"]);
if (typeof console !== "undefined" && console.warn) {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("props.pointerEvents is deprecated")
    ) {
      return;
    }
    originalWarn(...args);
  };
}

export default function RootLayout() {
  const { isAuthenticated, initializeAuth, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // Initialize secure store session on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle dynamic redirect guards
  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";

    const timer = setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        // Direct unauthorized users to login screen
        router.replace("/(auth)/login");
      } else if (isAuthenticated && inAuthGroup) {
        // Direct authenticated users to tab dashboard
        router.replace("/(tabs)");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, segments, isLoading, navigationState?.key]);

  return (
    <SafeAreaProvider style={styles.rootContainer}>
      <View style={styles.appContainer}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#F8FAFC" },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="appointment" options={{ headerShown: false }} />
          <Stack.Screen name="lab" options={{ headerShown: false }} />
          <Stack.Screen name="prescription" options={{ headerShown: false }} />

          <Stack.Screen name="billing" options={{ headerShown: false }} />
          <Stack.Screen name="health-card" options={{ headerShown: false }} />
          <Stack.Screen name="notifications/index" options={{ headerShown: false, presentation: "modal" }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "#E2E8F0" : "#F8FAFC",
  },
  appContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#F8FAFC",
    ...Platform.select({
      web: {
        maxWidth: 600,
        height: "100%",
        boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 12px 24px -8px rgba(15, 23, 42, 0.08)",
        borderColor: "#E2E8F0",
        borderLeftWidth: 1,
        borderRightWidth: 1,
      },
    }),
  },
});

