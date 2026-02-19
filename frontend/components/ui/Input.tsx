import type { ReactNode } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";

export interface InputProps extends TextInputProps {
  label?: string;
  helperText?: ReactNode;
}

export function Input({ label, helperText, ...rest }: InputProps) {
  return (
    <View>
      {label ? <Text>{label}</Text> : null}
      <TextInput {...rest} />
      {helperText}
    </View>
  );
}
