import type { ReactNode } from "react";
import { View } from "react-native";

export interface CategoryFilterProps {
  children?: ReactNode;
}

export function CategoryFilter({ children }: CategoryFilterProps) {
  return <View>{children}</View>;
}
