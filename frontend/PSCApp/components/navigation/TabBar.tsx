import type { ReactNode } from "react";
import { View } from "react-native";

export interface TabBarProps {
  children?: ReactNode;
}

export function TabBar({ children }: TabBarProps) {
  return <View>{children}</View>;
}
