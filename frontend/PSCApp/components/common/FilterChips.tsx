import type { ReactNode } from "react";
import { View } from "react-native";

export interface FilterChipsProps {
  children?: ReactNode;
}

export function FilterChips({ children }: FilterChipsProps) {
  return <View>{children}</View>;
}
