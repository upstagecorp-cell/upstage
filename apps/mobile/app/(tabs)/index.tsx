import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button, C, Card, Copy, Eyebrow, Heading, Logo, Page, SectionTitle, s } from '@/components/nexora/ui';
import { WorkspaceState } from '@/components/nexora/workspace-state';
import { useNexora } from '@/lib/nexora/context';

export default function Home() {
  const {workspace, session} = useNexora();
  const assessment = workspace?.assessments?.at(-1);
  const action = assessment?.recommendedActions?.[0];
  const plan = workspace?.weeklyPlans?.find(p => p.status === 'planned' || p.status === 'in_progress');
  return <Page>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Logo/><Text style={{fontSize:11,fontWeight:'700',color:C.muted,letterSpacing:1}}>YOUR WORKSPACE</Text></View>
    <View style={{gap:10, paddingTop:10}}><Eyebrow>MAKE SPACE FOR PROGRESS</Eyebrow><Heading>Small moves.{'\n'}Real momentum.</Heading><Copy>Clarity for your business, one thoughtful step at a time.</Copy></View>
    <View style={{backgroundColor:C.dark,borderRadius:24,padding:23,gap:16,overflow:'hidden'}}>
      <View style={{position:'absolute',right:-36,top:-58,width:180,height:180,borderRadius:90,borderWidth:1,borderColor:'#ffffff20'}}/><View style={{position:'absolute',right:-8,top:-30,width:125,height:125,borderRadius:70,borderWidth:1,borderColor:'#ffffff20'}}/>
      <Eyebrow light>YOUR NEXT MOVE</Eyebrow>
      <Text style={{fontSize:24,lineHeight:29,fontWeight:'700',letterSpacing:-.8,color:'#f6f8ef',maxWidth:290}}>{action?.title ?? 'A little clarity goes a long way.'}</Text>
      <Text style={{color:'#cbd9cd',fontSize:14,lineHeight:21}}>{action?.reason ?? 'Start with what’s on your mind. We’ll help you make a plan when your workspace is connected.'}</Text>
      <View style={{alignSelf:'flex-start',marginTop:2}}><Button title={action ? 'See your plan' : 'Find your direction'} onPress={() => router.push(action ? '/(tabs)/plan' : '/onboarding')} icon="arrow-forward" /></View>
    </View>
    <WorkspaceState />
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><SectionTitle title="This week" subtitle="Make room for one meaningful action."/><Ionicons name="calendar-outline" color={C.green} size={23}/></View>
    <Card><View style={{flexDirection:'row',gap:14,alignItems:'center'}}><View style={{width:42,height:42,borderRadius:13,backgroundColor:C.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name="checkmark-done-outline" size={22} color={C.green}/></View><View style={{flex:1,gap:4}}><Text style={s.cardTitle}>{plan?.title ?? 'Your week is a clean slate'}</Text><Copy>{plan ? `Due ${plan.dueDate} · ${plan.status.replace('_',' ')}` : session && workspace ? 'Add a goal when you’re ready.' : 'Your saved weekly goal will appear here.'}</Copy></View></View></Card>
    <View style={{flexDirection:'row',gap:12}}><Card style={{flex:1,backgroundColor:'#edf2e6'}}><Ionicons name="bulb-outline" size={21} color={C.green}/><Text style={s.cardTitle}>Think clearly</Text><Copy>Turn a question into a useful next step.</Copy></Card><Card style={{flex:1}}><Ionicons name="trending-up-outline" size={21} color={C.green}/><Text style={s.cardTitle}>Learn as you go</Text><Copy>Bring real results back into focus.</Copy></Card></View>
  </Page>;
}
