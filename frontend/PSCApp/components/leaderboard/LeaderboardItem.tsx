import { Text, View } from "react-native";

export interface LeaderboardItemProps {
  rank: number;
  name: string;
  score: number;
}

export function LeaderboardItem({ rank, name, score }: LeaderboardItemProps) {
  return (
    <View>
      <Text>
        #{rank} {name} - {score}
      </Text>
    </View>
  );
}
