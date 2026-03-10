import { Theme } from "@/constants/Theme";
import { FontAwesome } from "@expo/vector-icons";
import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";

export const KEYBOARD_DISMISS_ACCESSORY_ID = "keyboard-dismiss-accessory";

export function KeyboardDismissAccessory() {
  if (Platform.OS !== "ios") {
    return null;
  }

  return (
    <InputAccessoryView nativeID={KEYBOARD_DISMISS_ACCESSORY_ID}>
      <View style={styles.container}>
        <Pressable style={styles.button} onPress={Keyboard.dismiss}>
          <FontAwesome name="times" size={18} color={Theme.colors.text.primary} />
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.xs, alignItems: "flex-end" },
  button: { width: 32, height: 32, borderRadius: Theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.background.primary },
});
