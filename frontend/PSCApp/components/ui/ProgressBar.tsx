import { View } from "react-native";

export interface ProgressBarProps {
  progress: number; // 0 - 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View>
      {/* TODO: Replace with styled progress bar */}
      <View style={{ width: `${clamped * 100}%` }} />
    </View>
  );
}
