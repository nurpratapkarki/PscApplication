import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";

export interface LanguageToggleProps extends TouchableOpacityProps {
  currentLanguage: string;
}

export function LanguageToggle({ currentLanguage, ...rest }: LanguageToggleProps) {
  return (
    <TouchableOpacity {...rest}>
      <Text>Language: {currentLanguage}</Text>
    </TouchableOpacity>
  );
}
