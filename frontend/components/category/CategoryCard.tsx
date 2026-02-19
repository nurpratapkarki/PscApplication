import { Text, View } from "react-native";

export interface CategoryCardProps {
  name: string;
  description?: string | null;
}

export function CategoryCard({ name, description }: CategoryCardProps) {
  return (
    <View>
      <Text>{name}</Text>
      {description ? <Text>{description}</Text> : null}
    </View>
  );
}
