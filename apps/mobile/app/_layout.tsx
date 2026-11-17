import '@/global.css';
import '@/lib/_core/nativewind-pressable';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NexoraProvider, useNexora } from '@/lib/nexora/context';

function SecurityWarning() {
  const { securityWarning, retrySecureCleanup } = useNexora();
  const [error, setError] = useState('');
  if (!securityWarning) return null;
  return <SafeAreaView edges={['top']} style={{backgroundColor:'#fff0e8'}}><View accessibilityRole="alert" style={{padding:12, gap:6}}><Text style={{color:'#702d16'}}>{securityWarning}</Text>{!!error && <Text style={{color:'#702d16'}}>{error}</Text>}<Pressable accessibilityRole="button" onPress={() => { setError(''); void retrySecureCleanup().catch(e => setError(e instanceof Error ? e.message : 'Secure cleanup could not be completed.')); }}><Text style={{color:'#702d16', fontWeight:'700', textDecorationLine:'underline'}}>Retry secure cleanup</Text></Pressable></View></SafeAreaView>;
}
export const unstable_settings = { anchor: '(tabs)' };
export default function RootLayout() {
  return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider><NexoraProvider><SecurityWarning/><Stack screenOptions={{headerShown:false}}><Stack.Screen name="(tabs)" /><Stack.Screen name="login" /><Stack.Screen name="onboarding" /><Stack.Screen name="goal" /><Stack.Screen name="record-result" /></Stack><StatusBar style="dark" /></NexoraProvider></SafeAreaProvider></GestureHandlerRootView>;
}
