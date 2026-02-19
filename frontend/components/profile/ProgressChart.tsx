import { Text, View } from "react-native";

export interface ProgressChartProps {
  // Placeholder for chart data
  dataPoints: number[];
}

export function ProgressChart({ dataPoints }: ProgressChartProps) {
  return (
    <View>
      <Text>Points: {dataPoints.join(", ")}</Text>
    </View>
  );
}
