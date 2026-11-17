import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button, C, Card, Copy, ErrorText, Eyebrow, Heading, Page, SectionTitle, s } from '@/components/nexora/ui';
import { WorkspaceState } from '@/components/nexora/workspace-state';
import { message, useNexora } from '@/lib/nexora/context';
import { activePlans, approvedAssets, currentWeekStart, formatPlanDate, localDateKey, plansForCurrentWeek, weekProgress } from '@/lib/nexora/planning';
import type { Plan } from '@/lib/nexora/types';

function GoalCard({ goal, busy, onComplete }: { goal: Plan; busy: boolean; onComplete: (id: string) => void }) {
  const overdue = goal.status !== 'completed' && goal.dueDate < localDateKey();
  const done = goal.status === 'completed';
  return <Card style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: done ? '#eaf2df' : overdue ? '#f8eee6' : '#edf2e6', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={done ? 'checkmark-circle-outline' : overdue ? 'alert-circle-outline' : 'radio-button-on-outline'} size={21} color={done ? C.green : overdue ? C.warning : C.green} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={s.cardTitle}>{goal.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 }}>
          <Text style={{ color: overdue ? C.warning : C.muted, fontSize: 12, fontWeight: overdue ? '700' : '500' }}>{overdue ? 'Past due' : 'Due'} {formatPlanDate(goal.dueDate)}</Text>
          <Text style={{ color: C.muted }}>·</Text>
          <Text style={{ color: C.muted, fontSize: 12, textTransform: 'capitalize' }}>{goal.status.replace('_', ' ')}</Text>
        </View>
      </View>
    </View>
    {goal.evaluationMetric ? <View style={{ backgroundColor: '#f6f7f2', borderRadius: 12, padding: 12, gap: 4 }}>
      <Text style={{ fontSize: 10, color: C.muted, fontWeight: '800', letterSpacing: 1 }}>HOW YOU’LL MEASURE IT</Text>
      <Copy>{goal.evaluationMetric}</Copy>
    </View> : null}
    {goal.notes ? <Copy>{goal.notes}</Copy> : null}
    {!done && goal.status !== 'cancelled' && <Button title="Mark complete" secondary busy={busy} disabled={!!busy} onPress={() => onComplete(goal.id)} icon="checkmark-outline" />}
  </Card>;
}

export default function PlanScreen() {
  const { workspace, session, loading, mutate } = useNexora();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const latest = workspace?.assessments.at(-1);
  const actions = latest?.recommendedActions ?? [];
  const weekGoals = workspace ? plansForCurrentWeek(workspace.weeklyPlans) : [];
  const progress = weekProgress(weekGoals);
  const openGoals = workspace ? activePlans(workspace.weeklyPlans) : [];
  const overdueGoals = openGoals.filter(goal => goal.dueDate < localDateKey());
  const upcomingGoals = openGoals.filter(goal => goal.dueDate >= localDateKey());
  const completedGoals = weekGoals.filter(goal => goal.status === 'completed');
  const approved = workspace ? approvedAssets(workspace.assets).slice(0, 3) : [];
  const canNavigate = !session || (!!workspace && !loading);

  async function complete(id: string) {
    setBusy(id);
    setError('');
    try {
      const updated = await mutate(`/goals/${encodeURIComponent(id)}`, 'PATCH', { status: 'completed' });
      if (updated.weeklyPlans.find(plan => plan.id === id)?.status !== 'completed') {
        throw new Error('The server did not confirm the completed status.');
      }
    } catch (cause) {
      setError(`Could not confirm update. ${message(cause)} Refresh your workspace before retrying.`);
    } finally {
      setBusy('');
    }
  }

  function addGoal() {
    if (!session) router.push('/login');
    else if (actions.length) router.push('/goal');
    else router.push('/onboarding');
  }

  return <Page>
    <View style={{ gap: 8 }}>
      <Eyebrow>YOUR DIRECTION</Eyebrow>
      <Heading>Make a little{ '\n' }progress.</Heading>
      <Copy>Keep your priorities in view. Choose one useful step for this week.</Copy>
    </View>

    <WorkspaceState />

    <View style={{ gap: 13 }}>
      <SectionTitle title="Business priorities" subtitle="A short list to help you decide what comes next." />
      {actions.length ? actions.slice(0, 3).map((action, index) => <Card key={action.id} style={{ gap: 11 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Eyebrow>{index === 0 ? 'TOP PRIORITY' : `FOCUS ${index + 1}`}</Eyebrow>
          {action.kind ? <Text style={{ color: C.muted, fontSize: 11, textTransform: 'capitalize' }}>{action.kind.replace('_', ' ')}</Text> : null}
        </View>
        <Text accessibilityRole="header" style={s.cardTitle}>{action.title}</Text>
        <Copy>{action.reason}</Copy>
        {action.metric ? <Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>A useful signal: {action.metric}</Text> : null}
        {index === 0 && <Button title="Create a draft from this focus" onPress={() => router.push('/(tabs)/create')} icon="arrow-forward" />}
      </Card>) : <Card style={{ gap: 10 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#edf2e6', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="compass-outline" size={22} color={C.green} /></View>
        <Text style={s.cardTitle}>{workspace?.profile ? 'Your first business check is next' : 'Start by finding your direction'}</Text>
        <Copy>{workspace?.profile ? 'Your profile is saved. A business check can help identify the most useful priority.' : 'Share a little about your business and what you want to work on. Your answers are only saved after the server confirms them.'}</Copy>
        <Button title={session ? 'Start a business check' : 'Sign in to get started'} onPress={() => router.push(session ? '/onboarding' : '/login')} disabled={!canNavigate} icon="arrow-forward" />
      </Card>}
      {!!latest?.opportunities?.length && <Card style={{ backgroundColor: '#edf2e6' }}>
        <Text style={s.cardTitle}>Worth exploring</Text>
        {latest.opportunities.slice(0, 2).map((item, index) => <View key={`${index}-${item.description}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9 }}>
          <Ionicons name="sparkles-outline" size={17} color={C.green} style={{ marginTop: 2 }} />
          <Copy style={{ flex: 1 }}>{item.description}</Copy>
        </View>)}
      </Card>}
    </View>

    <View style={{ gap: 13 }}>
      <SectionTitle title="This week" subtitle={`Week of ${formatPlanDate(currentWeekStart())} · Keep the plan manageable.`} />
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.cardTitle}>{progress.total ? `${progress.completed} of ${progress.total} complete` : 'A fresh week, with room to choose'}</Text>
            <Copy>{progress.total ? `${progress.remaining} ${progress.remaining === 1 ? 'goal' : 'goals'} still in your plan` : 'Choose one clear action and give it a place in your week.'}</Copy>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#edf2e6', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.green, fontWeight: '800', fontSize: 15 }}>{progress.total ? `${Math.round(progress.fraction * 100)}%` : '—'}</Text>
          </View>
        </View>
        {progress.total > 0 && <View accessibilityRole="progressbar" accessibilityLabel="Weekly plan completion" accessibilityValue={{ min: 0, max: progress.total, now: progress.completed }} style={{ height: 8, backgroundColor: '#e8ece5', borderRadius: 10, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(progress.fraction * 100)}%`, height: '100%', backgroundColor: C.green, borderRadius: 10 }} />
        </View>}
      </Card>

      {overdueGoals.length > 0 && <View style={{ gap: 10 }}>
        <SectionTitle title="Needs a fresh look" subtitle="These goals are still open past their due date. Adjust them or mark them complete." />
        {overdueGoals.map(goal => <GoalCard key={goal.id} goal={goal} busy={busy === goal.id} onComplete={id => void complete(id)} />)}
      </View>}

      {upcomingGoals.length > 0 ? <View style={{ gap: 10 }}>
        <SectionTitle title="Up next" subtitle="Your open goals, ordered by what is due soonest." />
        {upcomingGoals.map(goal => <GoalCard key={goal.id} goal={goal} busy={busy === goal.id} onComplete={id => void complete(id)} />)}
      </View> : null}

      {!weekGoals.length && !openGoals.length && <Card style={{ alignItems: 'flex-start' }}>
        <Ionicons name="leaf-outline" size={23} color={C.green} />
        <Text style={s.cardTitle}>No weekly goals saved yet</Text>
        <Copy>{workspace ? 'Start with one achievable step. A saved recommendation can help keep it connected to your business direction.' : 'Sign in and load your workspace to see saved goals.'}</Copy>
      </Card>}

      {completedGoals.length > 0 && <View style={{ gap: 10 }}>
        <SectionTitle title="Done this week" subtitle="A record of the steps you have completed." />
        {completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} busy={false} onComplete={() => {}} />)}
      </View>}

      {!!error && <ErrorText>{error}</ErrorText>}
      <Button title={actions.length ? 'Add a weekly goal' : 'Find your first priority'} secondary onPress={addGoal} disabled={!canNavigate} />
    </View>

    {approved.length > 0 && <View style={{ gap: 13 }}>
      <SectionTitle title="Approved work" subtitle="The exact saved versions you have approved." />
      {approved.map(({ asset, version }) => <Card key={`${asset.id}-${version.version}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="checkmark-circle-outline" size={22} color={C.green} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.cardTitle}>{version.title || asset.kind}</Text>
          <Copy>{asset.channel} · Approved version {version.version}</Copy>
        </View>
      </Card>)}
      <Button title="Open your saved drafts" secondary onPress={() => router.push('/(tabs)/create')} />
    </View>}
  </Page>;
}
