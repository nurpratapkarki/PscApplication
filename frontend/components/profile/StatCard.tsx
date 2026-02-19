import { Text, View } from "react-native";

export interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <View>
      <Text>
        {label}: {value}
      </Text>
    </View>
  );
}
