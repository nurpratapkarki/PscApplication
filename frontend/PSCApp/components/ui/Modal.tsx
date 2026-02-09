import type { ReactNode } from "react";
import { Text, View } from "react-native";

export interface ModalProps {
  title?: string;
  visible: boolean;
  children?: ReactNode;
}

export function Modal({ title, visible, children }: ModalProps) {
  if (!visible) return null;

  return (
    <View>
      {title ? <Text>{title}</Text> : null}
      {children}
    </View>
  );
}
