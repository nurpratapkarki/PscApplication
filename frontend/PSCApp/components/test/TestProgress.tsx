import { Text, View } from "react-native";

export interface TestProgressProps {
  answered: number;
  total: number;
}

export function TestProgress({ answered, total }: TestProgressProps) {
  return (
    <View>
      <Text>
        {answered} / {total}
      </Text>
    </View>
  );
}
