import { Text, TouchableOpacity, View } from "react-native";

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
          <Text>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
