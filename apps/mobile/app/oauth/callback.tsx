import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Copy, Heading, Page } from '@/components/nexora/ui';

// The legacy callback is deliberately inert. URL parameters are never read or stored.
export default function OAuthCallback() {
  return <Page><View style={{gap: 12}}><Heading>Sign-in link unavailable</Heading><Copy>This legacy sign-in link is not supported. No session was created.</Copy><Text>Use NEXORA email sign-in instead.</Text><Button title="Go to sign in" onPress={() => router.replace('/login')} /></View></Page>;
}
