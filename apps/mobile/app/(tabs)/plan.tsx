import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Copy, ErrorText, Eyebrow, Heading, Page, SectionTitle, s } from '@/components/nexora/ui';
import { WorkspaceState } from '@/components/nexora/workspace-state';
import { message, useNexora } from '@/lib/nexora/context';
export default function PlanScreen() {
 const {workspace,mutate}=useNexora(); const [busy,setBusy]=useState('');const [error,setError]=useState('');const latest=workspace?.assessments?.at(-1);const action=latest?.recommendedActions?.[0];
 async function complete(id:string){setBusy(id);setError('');try{const updated=await mutate(`/goals/${encodeURIComponent(id)}`,'PATCH',{status:'completed'});if(updated.weeklyPlans.find(p=>p.id===id)?.status!=='completed')throw new Error('The server did not confirm the completed status.');}catch(e){setError(`Could not confirm update. ${message(e)}`);}finally{setBusy('');}}
 return <Page><View style={{gap:9}}><Eyebrow>YOUR DIRECTION</Eyebrow><Heading>Make a little{ '\n' }progress.</Heading><Copy>Keep the important things in view, and give this week a purpose.</Copy></View><WorkspaceState/>
 <SectionTitle title="Your focus" subtitle="A recommendation from your latest check."/>
 {action?<Card><Text style={s.cardTitle}>{action.title}</Text><Copy>{action.reason}</Copy></Card>:<Card><Text style={s.cardTitle}>No direction saved yet</Text><Copy>Start with a business check to bring your next action into focus.</Copy><Button title="Start your check" secondary onPress={()=>router.push('/onboarding')}/></Card>}
 <SectionTitle title="Weekly goals" subtitle="A manageable step is still a step forward."/>
 {workspace?.weeklyPlans.length ? workspace.weeklyPlans.map(p=><Card key={p.id}><View style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><Text style={[s.cardTitle,{flex:1}]}>{p.title}</Text><Text style={{color:'#69766c',fontSize:12}}>{p.status.replace('_',' ')}</Text></View><Copy>Due {p.dueDate} · Measure: {p.evaluationMetric}</Copy>{p.status!=='completed'&&p.status!=='cancelled'&&<Button title="Mark complete" secondary busy={busy===p.id} disabled={!!busy} onPress={()=>void complete(p.id)}/>}</Card>):<Card><Text style={s.cardTitle}>Nothing planned yet</Text><Copy>Your saved goals will appear here.</Copy></Card>}
 {!!error&&<ErrorText>{error}</ErrorText>}<Button title="Add a weekly goal" secondary disabled={!action} onPress={()=>router.push('/goal')}/>
 </Page>;
}
