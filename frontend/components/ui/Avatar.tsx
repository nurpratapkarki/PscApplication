import { Image, Text, View } from "react-native";

export interface AvatarProps {
  uri?: string | null;
  label?: string;
}

export function Avatar({ uri, label }: AvatarProps) {
  if (uri) {
    return <Image source={{ uri }} />;
  }

  return (
    <View>
      <Text>{label ?? "?"}</Text>
    </View>
  );
}
