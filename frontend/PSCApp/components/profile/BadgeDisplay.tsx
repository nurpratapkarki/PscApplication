import { Text, View } from "react-native";

export interface BadgeDisplayProps {
  badges: string[];
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  return (
    <View>
      {badges.map((badge) => (
        <Text key={badge}>{badge}</Text>
      ))}
    </View>
  );
}
