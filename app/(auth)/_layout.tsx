import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { auth } from "@/lib/auth";
import { Colors } from "@/constants/Colors";

export default function AuthLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      const token = await auth.getToken();

      if (alive && token && token.length >= 10) {
        router.replace("/(tabs)/Dashboard");
        return;
      }

      if (alive) setChecking(false);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.neutral.backgroundLight }}>
        <ActivityIndicator size="large" color={Colors.primary.green} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}