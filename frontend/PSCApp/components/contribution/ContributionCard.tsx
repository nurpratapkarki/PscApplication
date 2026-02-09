import { Text, View } from "react-native";

export interface ContributionCardProps {
  questionText: string;
  status: string;
}

export function ContributionCard({ questionText, status }: ContributionCardProps) {
  return (
    <View>
      <Text>{questionText}</Text>
      <Text>Status: {status}</Text>
    </View>
  );
}
