import { auth } from "@/src/lib/auth";
import { Colors } from "@/constants/Colors";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

const API_URL = "http://YOUR_LAN_IP:3000/api/analyze-food"; //dummy IP for now because we are not hosted properly yet.

export default function AddPhoto() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await auth.isAuthenticated();
      if (!isAuth) router.replace("/");
    };
    checkAuth();
  }, []);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: false,
      quality: 0.7,
    });

    //show confirmation when photo is captured
    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: "base64",
    });

    analyzeImage(base64);
  }

  async function analyzeImage(base64: string) {
    try {
      Alert.alert("Analyzing", "Sending image to AI");

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();

      showResults(data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to analyze image");
    }
  }

  function showResults(food: any) {
    const text = `Name: ${food.name}
Calories: ${food.calories}
Protein: ${food.protein} g
Carbs: ${food.carbs} g
Fat: ${food.fat} g`;

    Alert.alert("AI Result", text, [
      { text: "OK", onPress: () => router.replace("/Dashboard") },
    ]);
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
  container: { flex: 1, padding: 16, backgroundColor: Colors.neutral.backgroundLight, justifyContent: "center", alignItems: "center", gap: 20 },
  title: { fontSize: 28, fontWeight: "800", color: Colors.neutral.textDark },
  btn: { backgroundColor: Colors.primary.green, padding: 14, borderRadius: 12, alignItems: "center", minWidth: 200 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
