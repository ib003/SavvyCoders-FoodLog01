import { Colors } from "@/constants/Colors";
import { Stack } from "expo-router";

export default function AddLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: Colors.neutral.textDark,
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen 
        name="search" 
        options={{ 
          title: "Search Foods",
          headerBackTitle: "Back",
        }} 
      />
      <Stack.Screen 
        name="saved" 
        options={{ 
          title: "Saved Foods",
          headerBackTitle: "Back",
        }} 
      />
      <Stack.Screen 
        name="barcode" 
        options={{ 
          title: "Barcode Scan",
          headerBackTitle: "Back",
        }} 
      />
      <Stack.Screen 
        name="symptom" 
        options={{ 
          title: "Symptom Log",
          headerBackTitle: "Back",
        }} 
      />
      <Stack.Screen 
        name="photo" 
        options={{ 
          title: "Photo Log",
          headerBackTitle: "Back",
        }} 
      />
    </Stack>
  );
}
