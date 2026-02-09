import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { auth } from "@/lib/auth";
import { API_BASE } from "@/constants/api";

type Target = "/(auth)" | "/(tabs)";

export default function RootIndex() {
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<Target>("/(auth)");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = await auth.getToken();

        if (!token) {
          if (alive) setTarget("/(auth)");
          return;
        }

        // verify token using protected endpoint
        const res = await fetch(`${API_BASE}/api/user/preferences`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          await auth.logout();
          if (alive) setTarget("/(auth)");
          return;
        }

        if (alive) setTarget("/(tabs)");
      } catch {
        // if network fails, go to login
        if (alive) setTarget("/(auth)");
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={target} />;
}