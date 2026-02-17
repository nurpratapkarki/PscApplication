import { useMemo } from "react";
import { Stack } from "expo-router";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { useSettingsStore } from "../store/settingsStore";
import { useColors } from "../hooks/useColors";

export default function RootLayout() {
  const language = useSettingsStore((state) => state.language);
  const darkMode = useSettingsStore((state) => state.darkMode);
  const colors = useColors();

  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }

  const theme = useMemo(() => {
    const base = darkMode ? MD3DarkTheme : MD3LightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        onPrimary: colors.textOnPrimary,
        primaryContainer: colors.primaryLight,
        secondary: colors.accent,
        onSecondary: colors.textOnSecondary,
        secondaryContainer: colors.accentLight,
        tertiary: colors.secondary,
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: colors.surfaceVariant,
        error: colors.error,
        onError: colors.white,
        outline: colors.border,
      },
      roundness: 12,
    };
  }, [darkMode, colors]);

  return (
    <I18nextProvider i18n={i18n}>
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={darkMode ? "light" : "dark"} />
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
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="practice" options={{ headerShown: false }} />
          <Stack.Screen name="tests" options={{ headerShown: false }} />
          <Stack.Screen name="contribute" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="community" options={{ headerShown: false }} />
          <Stack.Screen name="report" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal", headerShown: false }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
    </I18nextProvider>
  );
}
