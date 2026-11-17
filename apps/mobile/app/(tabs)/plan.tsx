import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Button, C, Copy, ErrorText, Eyebrow, Logo, Page, s } from '@/components/nexora/ui';
import { WorkspaceState, WorkspaceUnavailable } from '@/components/nexora/workspace-state';
import { client, message, useNexora } from '@/lib/nexora/context';
import { activePlans, currentWeekStart, formatPlanDate, localDateKey, plansForCurrentWeek, weekProgress } from '@/lib/nexora/planning';
import type { Plan } from '@/lib/nexora/types';

function PriorityRow({ title, reason, metric, index, onPress }: { title: string; reason: string; metric: string; index: number; onPress?: () => void }) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }) => ({ minHeight: 84, flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingVertical: 15, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#e5e9e2', opacity: pressed && onPress ? 0.75 : 1 })}>
    <View style={{ width: 27, height: 27, borderRadius: 10, backgroundColor: index === 0 ? '#dce8cf' : '#eff1eb', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.green, fontSize: 12, fontWeight: '800' }}>{String(index + 1).padStart(2, '0')}</Text>
    </View>
    <View style={{ flex: 1, gap: 5 }}>
      <Text style={{ color: C.ink, fontSize: 15, lineHeight: 20, fontWeight: '700' }}>{title}</Text>
      <Copy>{reason}</Copy>
      {metric ? <Text style={{ color: C.green, fontSize: 11, lineHeight: 16, fontWeight: '700' }}>LOOK FOR · {metric}</Text> : null}
    </View>
    {onPress ? <Ionicons name="open-outline" size={17} color={C.green} style={{ marginTop: 3 }} /> : null}
  </Pressable>;
}

function GoalRow({ goal, busy, onComplete }: { goal: Plan; busy: boolean; onComplete: (id: string) => void }) {
  const overdue = goal.status !== 'completed' && goal.dueDate < localDateKey();
  const done = goal.status === 'completed';
  return <View style={{ minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#e7ebe4', paddingVertical: 11 }}>
    <Ionicons name={done ? 'checkmark-circle' : goal.status === 'in_progress' ? 'radio-button-on' : 'ellipse-outline'} size={21} color={done ? C.green : overdue ? C.warning : '#839087'} />
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ color: C.ink, fontSize: 14, lineHeight: 19, fontWeight: '600' }}>{goal.title}</Text>
      <Text style={{ color: overdue ? C.warning : C.muted, fontSize: 11, lineHeight: 16 }}>{overdue ? 'Past due' : 'Due'} {formatPlanDate(goal.dueDate)} · {goal.status.replace('_', ' ')}</Text>
      {goal.evaluationMetric ? <Text numberOfLines={1} style={{ color: C.muted, fontSize: 11 }}>{goal.evaluationMetric}</Text> : null}
    </View>
    {!done && goal.status !== 'cancelled' ? <Pressable accessibilityRole="button" accessibilityLabel={`Mark ${goal.title} complete`} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => onComplete(goal.id)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#edf1e8', opacity: busy ? 0.55 : 1 }}>
      {busy ? <Ionicons name="ellipsis-horizontal" size={19} color={C.green} /> : <Ionicons name="checkmark" size={20} color={C.green} />}
    </Pressable> : null}
  </View>;
}

export default function PlanScreen() {
  const { workspace, session, loading, mutate } = useNexora();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const latest = workspace?.assessments.at(-1);
  const actions = latest?.recommendedActions ?? [];
  const currentGoals = workspace ? plansForCurrentWeek(workspace.weeklyPlans) : [];
  const progress = weekProgress(currentGoals);
  const openGoals = workspace ? activePlans(workspace.weeklyPlans) : [];
  const overdueGoals = openGoals.filter(goal => goal.dueDate < localDateKey());
  const upcomingGoals = openGoals.filter(goal => goal.dueDate >= localDateKey());
  const completedGoals = currentGoals.filter(goal => goal.status === 'completed');
  const canNavigate = !session || (!!workspace && !loading);

  if (!session || !workspace) return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Logo /><Ionicons name="leaf-outline" size={20} color={C.green} /></View>
    <View style={{ gap: 8, paddingTop: 4 }}>
      <Eyebrow>YOUR DIRECTION</Eyebrow>
      <Text accessibilityRole="header" style={{ color: C.ink, fontSize: 32, lineHeight: 38, letterSpacing: -1.3, fontWeight: '700' }}>A plan with{ '\n' }room to breathe.</Text>
      <Copy>Priorities, weekly actions, and what you learn—together.</Copy>
    </View>
    <WorkspaceUnavailable />
    <View style={{ gap: 4, paddingTop: 4 }}>
      <Eyebrow>WHAT YOUR PLAN BRINGS TOGETHER</Eyebrow>
      {[
        ['01', 'Business priorities'],
        ['02', 'This week’s goals'],
        ['03', 'Approved work and results'],
      ].map(([number, label], index) => <View key={number} style={{ minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 13, borderTopWidth: 1, borderTopColor: '#e6e9e2', marginTop: index === 0 ? 5 : 0 }}>
        <Text style={{ width: 27, color: '#84927f', fontSize: 11, fontWeight: '800' }}>{number}</Text>
        <Text style={{ color: C.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>{label}</Text>
      </View>)}
    </View>
  </Page>;

  async function complete(id: string) {
    setBusy(id);
    setError('');
    try {
      const updated = await mutate(`/goals/${encodeURIComponent(id)}`, 'PATCH', { status: 'completed' });
      if (updated.weeklyPlans.find(plan => plan.id === id)?.status !== 'completed') throw new Error('The server did not confirm the completed status.');
    } catch (cause) {
      setError(`Could not confirm update. ${message(cause)} Refresh your workspace before retrying.`);
    } finally {
      setBusy('');
    }
  }

  return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Logo /><Ionicons name="leaf-outline" size={20} color={C.green} /></View>
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={{ color: C.ink, fontSize: 33, lineHeight: 38, letterSpacing: -1.35, fontWeight: '700' }}>A plan with{ '\n' }room to breathe.</Text>
      <Copy>Focus on what matters now. The rest can wait.</Copy>
    </View>

    <WorkspaceState />

    <View style={{ paddingTop: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
        <View style={{ gap: 4 }}>
          <Text accessibilityRole="header" style={s.section}>Start here</Text>
          <Copy>Your focus, in order.</Copy>
        </View>
        {actions.length > 0 && <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700' }}>{actions.length} SAVED</Text>}
      </View>
      {actions.length ? actions.slice(0, 3).map((action, index) => <PriorityRow key={action.id} title={action.title} reason={action.reason} metric={action.metric} index={index} onPress={index === 0 ? () => router.push('/(tabs)/create') : undefined} />) : <View style={{ marginTop: 13, padding: 17, borderRadius: 19, backgroundColor: '#e9eee3', gap: 9 }}>
        <Text style={{ color: C.ink, fontSize: 15, lineHeight: 21, fontWeight: '700' }}>{workspace?.profile ? 'Your first priority is waiting to be clarified.' : 'Every useful plan starts with a real question.'}</Text>
        <Copy>{workspace?.profile ? 'A short business check can help turn your saved direction into a clear focus.' : 'Share what is on your mind to shape a relevant business direction.'}</Copy>
        {!session ? client.origin ? <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: C.green, fontSize: 13, fontWeight: '800' }}>Sign in to continue →</Text></Pressable> : null : <Pressable accessibilityRole="button" disabled={!canNavigate} onPress={() => router.push('/onboarding')} style={{ minHeight: 44, justifyContent: 'center', opacity: canNavigate ? 1 : 0.5 }}><Text style={{ color: C.green, fontSize: 13, fontWeight: '800' }}>Start a business check →</Text></Pressable>}
      </View>}
      {!!latest?.opportunities?.length && <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: '#f0f2ec' }}>
        <Ionicons name="sparkles-outline" size={17} color={C.green} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, color: C.muted, fontSize: 12, lineHeight: 18 }}>{latest.opportunities[0].description}</Text>
      </View>}
    </View>

    <View style={{ height: 1, backgroundColor: C.border }} />

    <View style={{ gap: 13 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text accessibilityRole="header" style={s.section}>This week</Text>
          <Copy>Week of {formatPlanDate(currentWeekStart())}</Copy>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 1 }}>
          <Text style={{ color: C.green, fontSize: 20, lineHeight: 25, fontWeight: '800' }}>{progress.total ? `${progress.completed}/${progress.total}` : '—'}</Text>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: '700' }}>COMPLETE</Text>
        </View>
      </View>

      {progress.total > 0 && <View accessibilityRole="progressbar" accessibilityLabel="Weekly plan completion" accessibilityValue={{ min: 0, max: progress.total, now: progress.completed }} style={{ height: 5, backgroundColor: '#e3e8df', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(progress.fraction * 100)}%`, height: '100%', backgroundColor: '#759755', borderRadius: 4 }} />
      </View>}

      {overdueGoals.length > 0 && <View style={{ gap: 8 }}>
        <Text style={{ color: C.warning, fontSize: 10, fontWeight: '800', letterSpacing: 1.25 }}>REVISIT</Text>
        {overdueGoals.map(goal => <GoalRow key={goal.id} goal={goal} busy={busy === goal.id} onComplete={id => void complete(id)} />)}
      </View>}

      {upcomingGoals.length > 0 ? <View style={{ gap: 8 }}>
        <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.25 }}>{overdueGoals.length ? 'UP NEXT' : 'YOUR GOALS'}</Text>
        {upcomingGoals.map(goal => <GoalRow key={goal.id} goal={goal} busy={busy === goal.id} onComplete={id => void complete(id)} />)}
      </View> : null}

      {!currentGoals.length && !openGoals.length && <View style={{ paddingVertical: 16, gap: 6, borderTopWidth: 1, borderTopColor: '#e7ebe4' }}>
        <Text style={s.cardTitle}>{workspace ? 'Nothing scheduled just yet.' : 'Your saved goals will live here.'}</Text>
        <Copy>{workspace ? 'Choose one small, achievable step when you are ready.' : 'Connect your workspace to see your real plan.'}</Copy>
      </View>}

      {completedGoals.length > 0 && <View style={{ gap: 7 }}>
        <Text style={{ color: C.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.25 }}>DONE THIS WEEK</Text>
        {completedGoals.map(goal => <GoalRow key={goal.id} goal={goal} busy={false} onComplete={() => {}} />)}
      </View>}

      {!!error && <ErrorText>{error}</ErrorText>}
      {(actions.length > 0 || !!workspace || client.origin) && <Button title={actions.length ? 'Add a weekly goal' : workspace ? 'Set your direction' : 'Sign in to continue'} secondary disabled={!canNavigate} onPress={() => {
        if (!session) router.push('/login');
        else if (actions.length) router.push('/goal');
        else router.push('/onboarding');
      }} />}
    </View>
  </Page>;
}
