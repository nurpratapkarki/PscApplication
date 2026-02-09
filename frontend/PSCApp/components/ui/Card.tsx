import type { ReactNode } from "react";
import { View, Text } from "react-native";

export interface CardProps {
  title?: string;
  children?: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <View>
      {title ? <Text>{title}</Text> : null}
      {children}
    </View>
  );
}
