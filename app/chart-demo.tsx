import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ChartBox } from "@/components/charts/ChartBox";
import { mockWeeklyCalories } from "@/components/charts/mockData";
import { Theme } from "@/constants/Theme";

export default function ChartDemoScreen() {
  const data = mockWeeklyCalories();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ChartBox
          title="Weekly Calories"
          unit="kcal"
          data={data}
          emptyText="No weekly data yet"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
  },
  content: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing["3xl"],
    paddingBottom: Theme.spacing["3xl"],
  },
});
