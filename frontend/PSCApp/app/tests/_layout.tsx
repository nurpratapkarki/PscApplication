import { Stack } from "expo-router";
import { Colors } from "../../constants/colors";

export default function TestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
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

