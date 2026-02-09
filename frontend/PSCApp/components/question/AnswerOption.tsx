import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

export interface AnswerOptionProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
  isCorrect?: boolean;
}

export function AnswerOption({ label, selected, isCorrect, ...rest }: AnswerOptionProps) {
  return (
    <TouchableOpacity {...rest}>
      <Text>
        {selected ? "> " : ""}
        {label}
        {isCorrect ? " (✓)" : ""}
      </Text>
    </TouchableOpacity>
  );
}
