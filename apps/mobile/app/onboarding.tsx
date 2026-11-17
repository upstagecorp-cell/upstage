import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, C, Copy, ErrorText, Eyebrow, Field, Heading, Page, s } from '@/components/nexora/ui';
import { message, useNexora } from '@/lib/nexora/context';
import { requestId } from '@/lib/nexora/workspace';
const focuses = [['awareness','Find more customers'],['conversion','Turn interest into sales'],['profitability','Improve profitability'],['retention','Bring customers back'],['operations','Make work more manageable']];
const types = [['general','Other'],['restaurant','Restaurant'],['cafe','Cafe'],['accommodation','Accommodation'],['retail','Retail'],['ecommerce','E-commerce'],['services','Services'],['creator','Creator']];
const stages = [['planning','Planning'],['launching','Launching'],['operating','Operating'],['growing','Growing'],['not_sure','Not sure']];
function Choices({label, options, value, onChange}:{label:string;options:string[][];value:string;onChange:(v:string)=>void}) {return <View style={{gap:9}}><Text style={s.label}>{label}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{options.map(([id,title])=><Pressable key={id} accessibilityRole="button" accessibilityState={{selected:value===id}} onPress={()=>onChange(id)} style={{minHeight:44,justifyContent:'center',paddingHorizontal:13,borderWidth:1,borderColor:value===id?C.green:C.border,backgroundColor:value===id?'#e7efd8':'white',borderRadius:12}}><Text style={{color:C.ink,fontSize:13,fontWeight:value===id?'700':'500'}}>{title}</Text></Pressable>)}</View></View>;}
export default function Onboarding() {
  const {session,workspace,mutate}=useNexora(); const [focus,setFocus]=useState('');const [type,setType]=useState('');const [stage,setStage]=useState('');const [offer,setOffer]=useState('');const [channel,setChannel]=useState('');const [customer,setCustomer]=useState('');const [goal,setGoal]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const checkId=useRef(requestId());
  async function save() {
    if(!session){setError('Sign in first. Your answers on this screen are not saved.');return;}
    if(!workspace){setError('Load your workspace before saving. Your answers remain on this screen.');return;}
    if(!focus||!type||!stage){setError('Choose a focus, business type and stage.');return;}
    setBusy(true);setError('');
    try {const updated=await mutate('/first-check','POST',{clientRequestId:checkId.current,confirmed:true,expectedVersion:workspace.profile?.version ?? 0,check:{version:1,id:checkId.current,focus,businessType:type,stage,offering:offer,channel,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',evidence:[],customerType:customer,monthlyGoal:goal}},{requestId:checkId.current,collection:'assessments'});if(!updated.profile || updated.profile.version <= (workspace.profile?.version ?? 0)) throw new Error('The server did not confirm the new business check.');if((customer.trim() && updated.profile.customerType!==customer.trim()) || (goal.trim() && updated.profile.questionAnswers?.monthlyGoal!==goal.trim())) throw new Error('The server did not confirm the customer or monthly goal fields. Other check details may have been saved.');router.replace('/(tabs)');}
    catch(e){setError(`Could not confirm save. ${message(e)} Your answers remain here; refresh your workspace before retrying.`);}finally{setBusy(false);}
  }
  return <Page><Pressable accessibilityRole="button" onPress={()=>router.back()} style={{minHeight:44,justifyContent:'center'}}><Text style={s.link}>← Back</Text></Pressable><View style={{gap:9}}><Eyebrow>FIRST DIRECTION</Eyebrow><Heading>Let’s start with you.</Heading><Copy>A few details can help turn what’s on your mind into a clear next move. If the server cannot confirm a save, refresh before retrying.</Copy></View>
    <Choices label="What’s on your mind?" options={focuses} value={focus} onChange={setFocus}/><Choices label="Your business type" options={types} value={type} onChange={setType}/><Choices label="Your stage" options={stages} value={stage} onChange={setStage}/><Field label="What do you offer?" value={offer} onChangeText={setOffer} multiline placeholder="Describe your offer"/><Field label="Who do you serve?" value={customer} onChangeText={setCustomer} placeholder="Your intended customer"/><Field label="Your main sales or marketing channel" value={channel} onChangeText={setChannel} placeholder="A channel you use"/><Field label="Your goal this month" value={goal} onChangeText={setGoal} placeholder="What would you like to work toward?"/>
    <Copy>Customer and monthly goal fields require support in the future mobile API. Optional measurements are not available here yet.</Copy>{!!error&&<ErrorText>{error}</ErrorText>}<Button title={session?'Save and find direction':'Sign in to save'} busy={busy} onPress={()=>session?void save():router.push('/login')} icon="arrow-forward"/>
  </Page>;
}
