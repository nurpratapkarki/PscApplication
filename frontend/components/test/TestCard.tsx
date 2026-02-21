import { Text, View } from "react-native";
import i18next from "i18next";

export function TestCard() {
  return (
    <View>
      <Text>{i18next.t("placeholders.testCard")}</Text>
    </View>
  );
}
