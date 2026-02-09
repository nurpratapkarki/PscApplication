import type { ReactNode } from "react";
import { View } from "react-native";

export interface LeaderboardFiltersProps {
  children?: ReactNode;
}

export function LeaderboardFilters({ children }: LeaderboardFiltersProps) {
  return <View>{children}</View>;
}
