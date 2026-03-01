import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

function ChatButton() {
  const router = useRouter();
  
  return (
    <TouchableOpacity
      onPress={() => router.push('/chat')}
      style={{ marginRight: 15 }}
    >
      <FontAwesome name="commenting-o" size={24} color="#007AFF" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: { display: "flex" },
        headerRight: () => <ChatButton />,
      }}
      initialRouteName="Dashboard"
    >
      {/* Removed index route - using Dashboard as initial route instead */}

      <Tabs.Screen
        name="Dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="AddMeal"
        options={{
          title: "Add Meal",
          tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />

      <Tabs.Screen
        name="AllergenWarning"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <TabBarIcon name="exclamation-triangle" color={color} />,
        }}
      />

      <Tabs.Screen
        name="AllergiesPreferences"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="symptom"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="photo"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="barcode"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
