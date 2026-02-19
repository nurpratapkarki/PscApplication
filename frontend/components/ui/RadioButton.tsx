import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

export interface RadioButtonProps extends TouchableOpacityProps {
  label?: string;
  selected?: boolean;
}

export function RadioButton({ label, selected, ...rest }: RadioButtonProps) {
  return (
    <TouchableOpacity {...rest}>
      <Text>{selected ? "(o)" : "( )"} {label}</Text>
    </TouchableOpacity>
  );
}
