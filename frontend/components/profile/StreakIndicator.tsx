import { Text, View } from "react-native";

export interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakIndicator({ currentStreak, longestStreak }: StreakIndicatorProps) {
  return (
    <View>
      <Text>Current streak: {currentStreak}</Text>
      <Text>Longest streak: {longestStreak}</Text>
    </View>
  );
}
