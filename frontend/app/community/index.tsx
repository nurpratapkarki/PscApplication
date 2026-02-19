import { Redirect } from 'expo-router';

// Redirect to live-feed as the default community page
export default function CommunityIndex() {
  return <Redirect href="/community/live-feed" />;
}

