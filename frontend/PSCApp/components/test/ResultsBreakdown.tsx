import { Text, View } from "react-native";

export interface ResultsBreakdownProps {
  correct: number;
  incorrect: number;
  skipped: number;
}

export function ResultsBreakdown({ correct, incorrect, skipped }: ResultsBreakdownProps) {
  return (
    <View>
      <Text>Correct: {correct}</Text>
      <Text>Incorrect: {incorrect}</Text>
      <Text>Skipped: {skipped}</Text>
    </View>
  );
}
