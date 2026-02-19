import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

export interface ChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
}

export function Chip({ label, selected, ...rest }: ChipProps) {
  return (
    <TouchableOpacity {...rest}>
      <Text>
        {label}
        {selected ? " *" : ""}
      </Text>
    </TouchableOpacity>
  );
}
