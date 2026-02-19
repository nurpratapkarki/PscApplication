import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
}

export function Button({ label, ...rest }: ButtonProps) {
  return (
    <TouchableOpacity {...rest}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}
