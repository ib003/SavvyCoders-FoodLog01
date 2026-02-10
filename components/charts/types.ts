import type { ViewStyle } from "react-native";

export type ChartPoint = {
  label: string;
  value: number;
};

export interface ChartBoxProps {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  unit?: string;
  loading?: boolean;
  emptyText?: string;
  style?: ViewStyle;
}
