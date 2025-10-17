import { Stack } from "expo-router";

export default function AddLayout() {
  return (
    <Stack>
      <Stack.Screen name="search" options={{ title: "Search Meals" }} />
      <Stack.Screen name="saved" options={{ title: "Saved Items" }} />
      <Stack.Screen name="barcode" options={{ title: "Barcode Scan" }} />
    </Stack>
  );
}
