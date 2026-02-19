import { Text, View } from "react-native";

export interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
}
