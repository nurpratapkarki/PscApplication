import { Text, View } from "react-native";
import i18next from "i18next";

export interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakIndicator({ currentStreak, longestStreak }: StreakIndicatorProps) {
  return (
    <View>
      <Text>{i18next.t("profile.currentStreak", { count: currentStreak })}</Text>
      <Text>{i18next.t("profile.longestStreak", { count: longestStreak })}</Text>
    </View>
  );
}
