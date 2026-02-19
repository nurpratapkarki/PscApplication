import { Text, View } from "react-native";

export interface RankBadgeProps {
  rank: number;
}

export function RankBadge({ rank }: RankBadgeProps) {
  return (
    <View>
      <Text>#{rank}</Text>
    </View>
  );
}
