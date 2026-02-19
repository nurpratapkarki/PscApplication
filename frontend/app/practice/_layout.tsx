import { Stack } from "expo-router";
import { useColors } from "../../hooks/useColors";

export default function PracticeLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="[categoryId]/index" options={{ headerShown: false }} />
      <Stack.Screen name="[categoryId]/question" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ headerShown: false }} />
    </Stack>
  );
}
