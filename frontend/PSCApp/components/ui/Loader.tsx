import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";

export type LoaderProps = ActivityIndicatorProps;

export function Loader(props: LoaderProps) {
  return <ActivityIndicator {...props} />;
}
