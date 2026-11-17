import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Copy, Eyebrow, Heading, Page, SectionTitle, s } from '@/components/nexora/ui';
import { WorkspaceState } from '@/components/nexora/workspace-state';
import { useNexora } from '@/lib/nexora/context';
import { formatMetric } from '@/lib/nexora/format';
export default function Results() {const {workspace}=useNexora();return <Page><View style={{gap:9}}><Eyebrow>LEARN FROM WHAT HAPPENS</Eyebrow><Heading>Every result{ '\n' }tells a story.</Heading><Copy>Record what you actually did and what happened next.</Copy></View><WorkspaceState/><SectionTitle title="Your results" subtitle="Real observations, not assumptions."/>{workspace?.results.length?workspace.results.map(r=><Card key={r.id}><Text style={s.cardTitle}>{r.metric.replace(/([A-Z])/g,' $1')}</Text><Text style={{fontSize:28,fontWeight:'700',color:'#20372f'}}>{formatMetric(r.value,r.unit,r.currency)}</Text><Copy>{r.periodStart} – {r.periodEnd}{r.sourceNote ? ` · ${r.sourceNote}` : ''}</Copy></Card>):<Card><Text style={s.cardTitle}>No results recorded</Text><Copy>When you’ve used an action, add a result and a source to see what you learned.</Copy></Card>}
 <Button title="Record a result" secondary disabled={!workspace?.executions.length} onPress={()=>router.push('/record-result')}/><Copy>{workspace?.executions.length ? 'Results are linked to a recorded use of an action.' : 'A recorded use is required before adding a result. Recording usage in mobile is not available yet.'}</Copy></Page>;}
