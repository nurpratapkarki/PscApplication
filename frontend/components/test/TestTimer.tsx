import { Text, View } from "react-native";

export interface TestTimerProps {
  remainingSeconds: number;
}

export function TestTimer({ remainingSeconds }: TestTimerProps) {
  return (
    <View>
      <Text>{remainingSeconds}s</Text>
    </View>
  );
}
