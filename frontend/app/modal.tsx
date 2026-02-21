import { Text, View } from "react-native";
import i18next from "i18next";

export default function ExampleModal() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{i18next.t("placeholders.exampleModal")}</Text>
    </View>
  );
}
