import React, { useEffect, useState } from "react";
import { Slot, useSegments, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("jwt");
      const inAuth = segments[0] === "(auth)";
      if (!token && !inAuth) router.replace("/(auth)/login");
      if (token && inAuth) router.replace("/(tabs)/Dashboard");
      setReady(true);
    })();
  }, [segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <Slot />;
}
