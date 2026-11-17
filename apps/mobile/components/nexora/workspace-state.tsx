import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button, C, Copy, s } from '@/components/nexora/ui';
import { client, useNexora } from '@/lib/nexora/context';

export function WorkspaceUnavailable() {
  const { session, restoring, loading, error, refresh } = useNexora();
  const disconnected = !client.origin;
  const waiting = restoring || loading;
  const heading = waiting
    ? restoring ? 'Checking your workspace' : 'Loading your workspace'
    : error ? 'Your workspace did not load'
      : disconnected ? 'Workspace service unavailable'
        : session ? 'Workspace data unavailable' : 'Your workspace is private';
  const detail = waiting
    ? restoring ? 'Restoring your secure session.' : 'Fetching saved plans and priorities.'
    : error ? 'Your saved work has not changed. Try again when your connection is ready.'
      : disconnected ? 'This preview is not connected to NEXORA’s mobile service, so saved plans and recommendations cannot be loaded here.'
        : session ? 'Your saved workspace could not be displayed right now.'
          : 'Sign in to see your own business priorities, weekly goals, and approved work.';
  const icon = waiting ? null : error ? 'cloud-offline-outline' : disconnected ? 'link-outline' : session ? 'alert-circle-outline' : 'lock-closed-outline';

  return <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#e9eee3', gap: 13 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <View style={{ width: 39, height: 39, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        {icon ? <Ionicons name={icon} size={19} color={error ? C.warning : C.green} /> : <ActivityIndicator size="small" color={C.green} />}
      </View>
      <Text accessibilityRole="header" style={{ flex: 1, color: C.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' }}>{heading}</Text>
    </View>
    <Copy>{detail}</Copy>
    {error && session ? <Button title="Retry loading your workspace" secondary onPress={() => void refresh()} /> : null}
    {!waiting && !error && !session && !disconnected ? <Button title="Sign in to your workspace" onPress={() => router.push('/login')} icon="arrow-forward" /> : null}
  </View>;
}

export function WorkspaceState() {
  const { session, restoring, loading, error, refresh } = useNexora();
  if (!restoring && !loading && !error && session && client.origin) return null;
  return <View style={{ borderLeftWidth: 3, borderLeftColor: error ? C.warning : '#8caa62', paddingLeft: 13, paddingVertical: 5, gap: 4 }}>
    <Text style={s.cardTitle}>{restoring ? 'Restoring your workspace' : loading ? 'Loading your workspace' : error ? 'Your workspace did not load' : !client.origin ? 'Mobile service unavailable' : 'Your workspace is private'}</Text>
    <Copy>{restoring ? 'Checking your secure session.' : loading ? 'Fetching your saved work.' : error ? 'Your saved work has not changed.' : !client.origin ? 'This app preview is not connected to NEXORA’s mobile service.' : 'Sign in to load your saved plans and priorities.'}</Copy>
    {error && session ? <Pressable accessibilityRole="button" onPress={() => void refresh()} style={{ minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' }}><Text style={{ color: C.green, fontSize: 13, fontWeight: '800' }}>Try again →</Text></Pressable> : null}
    {!session && client.origin ? <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={{ minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' }}><Text style={{ color: C.green, fontSize: 13, fontWeight: '800' }}>Sign in →</Text></Pressable> : null}
  </View>;
}
