import { router } from 'expo-router';
import { client, useNexora } from '@/lib/nexora/context';
import { Notice } from './ui';

export function WorkspaceState() {
  const {session, restoring, loading, error, refresh} = useNexora();
  if (restoring) return <Notice title="Checking your session">Your secure session is being restored.</Notice>;
  if (!session) return <Notice title={client.origin ? 'Your workspace is private' : 'Not connected yet'} action="Sign in" onPress={() => router.push('/login')}>{client.origin ? 'Sign in to see your own plans, drafts, and results.' : 'The mobile service is not configured. Sign in will become available when a public HTTPS API origin is connected.'}</Notice>;
  if (loading) return <Notice title="Loading your workspace">Getting your latest saved work…</Notice>;
  if (error) return <Notice title="Couldn’t load your workspace" action="Try again" onPress={() => void refresh()}>{error}</Notice>;
  return null;
}
