import { TextInput, type TextInputProps } from "react-native";

export type SearchBarProps = TextInputProps;

export function SearchBar(props: SearchBarProps) {
  return <TextInput {...props} />;
}
