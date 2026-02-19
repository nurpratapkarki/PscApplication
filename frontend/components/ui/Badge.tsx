import { Text, View } from "react-native";

export interface BadgeProps {
  label: string;
}

export function Badge({ label }: BadgeProps) {
  return (
    <View>
      <Text>{label}</Text>
    </View>
  );
}
