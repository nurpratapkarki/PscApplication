import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export interface TestSubmitDialogProps {
  visible: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export function TestSubmitDialog({
  visible,
  onConfirm,
  onCancel,
  children,
}: TestSubmitDialogProps) {
  if (!visible) return null;

  return (
    <View>
      <Text>Submit test?</Text>
      {children}
      <View>
        <TouchableOpacity onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onConfirm}>
          <Text>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
