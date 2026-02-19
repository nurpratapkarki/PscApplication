import type { ReactNode } from "react";
import { View } from "react-native";

export interface DrawerContentProps {
  children?: ReactNode;
}

export function DrawerContent({ children }: DrawerContentProps) {
  return <View>{children}</View>;
}
