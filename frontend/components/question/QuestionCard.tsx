import { Text, View } from "react-native";
import i18next from "i18next";

export function QuestionCard() {
  return (
    <View>
      <Text>{i18next.t("placeholders.questionCard")}</Text>
    </View>
  );
}
