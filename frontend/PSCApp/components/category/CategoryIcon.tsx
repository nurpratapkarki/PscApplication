import { Text, View } from "react-native";

export interface CategoryIconProps {
  name: string;
}

export function CategoryIcon({ name }: CategoryIconProps) {
  return (
    <View>
      <Text>{name}</Text>
    </View>
  );
}
