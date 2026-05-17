import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors, font } from "../src/constants/theme";
import {
  addNotificationTapListener,
  configureLocalNotifications
} from "../src/services/notifications";
import { useVoltStore } from "../src/store/useVoltStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const initialize = useVoltStore((state) => state.initialize);
  const isReady = useVoltStore((state) => state.isReady);
  const dbError = useVoltStore((state) => state.dbError);

  useEffect(() => {
    initialize();
    configureLocalNotifications();
  }, [initialize]);

  useEffect(() => {
    const subscription = addNotificationTapListener((screen) => router.push(screen as never));
    return () => subscription.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={colors.bg} />
          {isReady ? (
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: { backgroundColor: colors.bg }
              }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.muted, fontFamily: font.medium, fontSize: 12 }}>
                Opening local VOLT cache
              </Text>
            </View>
          )}
          {dbError ? (
            <View style={{ backgroundColor: colors.criticalBg, padding: 10 }}>
              <Text style={{ color: colors.critical, fontFamily: font.medium, fontSize: 12 }}>
                Local database warning: {dbError}
              </Text>
            </View>
          ) : null}
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
