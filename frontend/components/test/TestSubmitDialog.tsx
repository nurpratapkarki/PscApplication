import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import i18next from "i18next";

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
      <Text>{i18next.t("tests.finishConfirm")}</Text>
      {children}
      <View>
        <TouchableOpacity onPress={onCancel}>
          <Text>{i18next.t("common.cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onConfirm}>
          <Text>{i18next.t("common.submit")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
