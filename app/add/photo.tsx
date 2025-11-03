import * as ImagePicker from "expo-image-picker";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function AddPhoto() {
  //open native camera to capture food photo
  async function openCamera() {
    //request camera permission
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera access is required to take photos");
      return;
    }

    //launch camera with image-only setting
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    //show confirmation when photo is captured
    if (!result.canceled) {
      Alert.alert("Photo captured", "Photo saved (mock)");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo Log</Text>
      <Pressable style={styles.btn} onPress={openCamera}>
        <Text style={styles.btnText}>Open Camera</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2E2E2E",
  },
  btn: {
    backgroundColor: "#5DBB63",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
  },
  btnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
