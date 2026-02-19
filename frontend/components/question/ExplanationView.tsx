import type { ReactNode } from "react";
import { Text, View } from "react-native";

export interface ExplanationViewProps {
  title?: string;
  children?: ReactNode;
}

export function ExplanationView({ title, children }: ExplanationViewProps) {
  return (
    <View>
      {title ? <Text>{title}</Text> : null}
      {children}
    </View>
  );
}
