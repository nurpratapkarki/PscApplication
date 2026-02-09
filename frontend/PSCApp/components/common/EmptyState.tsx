import { Text, View } from "react-native";

export interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View>
      <Text>{title}</Text>
      {description ? <Text>{description}</Text> : null}
    </View>
  );
}
