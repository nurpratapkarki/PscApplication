import { Stack } from "expo-router";
import { Colors } from "../../constants/colors";

export default function PracticeLayout() {
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
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="[categoryId]/index" options={{ headerShown: false }} />
      <Stack.Screen name="[categoryId]/question" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ headerShown: false }} />
    </Stack>
  );
}

