import { Text, TouchableOpacity, View } from "react-native";
import i18next from "i18next";

export interface QuestionNavigatorProps {
  currentIndex: number;
  total: number;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function QuestionNavigator({
  currentIndex,
  total,
  onNext,
  onPrevious,
}: QuestionNavigatorProps) {
  return (
    <View>
      <Text>
        {currentIndex} / {total}
      </Text>
      <View>
        <TouchableOpacity onPress={onPrevious}>
          <Text>{i18next.t("tests.previous")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext}>
          <Text>{i18next.t("tests.next")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
