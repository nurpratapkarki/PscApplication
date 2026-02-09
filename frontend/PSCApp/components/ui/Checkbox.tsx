import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

export interface CheckboxProps extends TouchableOpacityProps {
  label?: string;
  checked?: boolean;
}

export function Checkbox({ label, checked, ...rest }: CheckboxProps) {
  return (
    <TouchableOpacity {...rest}>
      <Text>{checked ? "[x]" : "[ ]"} {label}</Text>
    </TouchableOpacity>
  );
}
