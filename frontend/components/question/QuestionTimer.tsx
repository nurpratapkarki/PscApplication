import { Text, View } from "react-native";

export interface QuestionTimerProps {
  remainingSeconds: number;
}

export function QuestionTimer({ remainingSeconds }: QuestionTimerProps) {
  return (
    <View>
      <Text>{remainingSeconds}s</Text>
    </View>
  );
}
