import { Redirect } from 'expo-router';

// Redirect to the main profile page in tabs
export default function ProfileIndex() {
  return <Redirect href="/(tabs)/profile" />;
}

