import { Text, View } from "react-native";

export interface ContributionStatsProps {
  totalContributions: number;
  madePublic: number;
}

export function ContributionStats({ totalContributions, madePublic }: ContributionStatsProps) {
  return (
    <View>
      <Text>Total: {totalContributions}</Text>
      <Text>Public: {madePublic}</Text>
    </View>
  );
}
