import { Stack } from "expo-router";
import { useColors } from "../../hooks/useColors";

export default function TestsLayout() {
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
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="[testId]/index" options={{ headerShown: false }} />
      <Stack.Screen name="[testId]/instructions" options={{ headerShown: false }} />
      <Stack.Screen name="[testId]/attempt" options={{ headerShown: false }} />
      <Stack.Screen name="[testId]/results" options={{ headerShown: false }} />
    </Stack>
  );
}
