import type { ReactNode } from "react";
import { View } from "react-native";

export interface QuestionFormProps {
  children?: ReactNode;
}

export function QuestionForm({ children }: QuestionFormProps) {
  return <View>{children}</View>;
}
