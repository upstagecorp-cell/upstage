import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, C, Copy, ErrorText, Eyebrow, Field, Heading, Logo, Page, s } from '@/components/nexora/ui';
import { client, message, useNexora } from '@/lib/nexora/context';
export default function Login() {
  const {signIn} = useNexora(); const [email,setEmail] = useState(''); const [password,setPassword] = useState(''); const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  async function submit() { if (!email.trim() || !password) {setError('Enter your email and password.'); return;} setBusy(true);setError('');try {await signIn(email.trim(),password);setPassword('');router.back();} catch(e) {setError(message(e));} finally {setBusy(false);} }
  return <Page><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={()=>router.back()} style={{minHeight:44,justifyContent:'center'}}><Text style={s.link}>← Back</Text></Pressable><Logo/><View style={{gap:10,marginTop:8}}><Eyebrow>YOUR SPACE TO GROW</Eyebrow><Heading>Good to see you.</Heading><Copy>Sign in to continue with your NEXORA workspace.</Copy></View>
    {!client.origin && <View style={{backgroundColor:'#edf2e6',borderRadius:14,padding:15}}><Text style={{color:C.ink,fontWeight:'700'}}>Mobile service not connected</Text><Copy>Sign-in requires a public HTTPS API origin configured by the app operator.</Copy></View>}
    <View style={{gap:16}}><Field label="Email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} placeholder="Your email address"/><Field label="Password" secureTextEntry textContentType="password" value={password} onChangeText={setPassword} placeholder="Your password" onSubmitEditing={()=>void submit()}/>{!!error && <ErrorText>{error}</ErrorText>}<Button title="Sign in" onPress={()=>void submit()} busy={busy} icon="arrow-forward"/></View>
    <Copy>Account registration and password reset are not available in the mobile app yet.</Copy>
  </Page>;
}
