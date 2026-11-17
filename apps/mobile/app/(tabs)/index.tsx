import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button, C, Card, Copy, Eyebrow, Heading, Logo, Page, SectionTitle, s } from '@/components/nexora/ui';
import { WorkspaceState } from '@/components/nexora/workspace-state';
import { useNexora } from '@/lib/nexora/context';
import { approvedAssets, currentWeekStart, formatPlanDate, plansForCurrentWeek, weekProgress } from '@/lib/nexora/planning';

function StatusPill({ label, completed = false }: { label: string; completed?: boolean }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: completed ? '#eaf2df' : '#f1f3ef' }}>
    <Ionicons name={completed ? 'checkmark-circle' : 'time-outline'} size={13} color={completed ? C.green : C.muted} />
    <Text style={{ color: completed ? C.green : C.muted, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{label.replace('_', ' ')}</Text>
  </View>;
}

export default function Home() {
  const { workspace, session, loading } = useNexora();
  const assessment = workspace?.assessments.at(-1);
  const action = assessment?.recommendedActions[0];
  const weekGoals = workspace ? plansForCurrentWeek(workspace.weeklyPlans) : [];
  const progress = weekProgress(weekGoals);
  const approved = workspace ? approvedAssets(workspace.assets).slice(0, 2) : [];
  const directionLabel = workspace?.profile?.name?.trim();
  const canNavigateToOnboarding = !session || (!!workspace && !loading);

  function openDirection() {
    router.push(session ? '/onboarding' : '/login');
  }

  return <Page>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <Logo />
      <Text numberOfLines={1} style={{ maxWidth: '58%', fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2 }}>YOUR WORKSPACE</Text>
    </View>

    <View style={{ gap: 8, paddingTop: 3 }}>
      <Eyebrow>{directionLabel ? `A SPACE FOR ${directionLabel.toUpperCase()}` : 'MAKE SPACE FOR PROGRESS'}</Eyebrow>
      <Heading>Small moves.{ '\n' }Real momentum.</Heading>
      <Copy>Keep your next thoughtful step close, and make this week count.</Copy>
    </View>

    <View style={{ backgroundColor: C.dark, borderRadius: 25, padding: 23, gap: 15, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', right: -44, top: -62, width: 188, height: 188, borderRadius: 100, borderWidth: 1, borderColor: '#ffffff22' }} />
      <View pointerEvents="none" style={{ position: 'absolute', right: -11, top: -30, width: 124, height: 124, borderRadius: 70, borderWidth: 1, borderColor: '#ffffff22' }} />
      <Eyebrow light>YOUR NEXT MOVE</Eyebrow>
      <Text accessibilityRole="header" style={{ maxWidth: 300, color: '#f6f8ef', fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.8 }}>
        {action?.title ?? (workspace?.profile ? 'Bring your direction into focus.' : 'Find your next clear step.')}
      </Text>
      <Text style={{ color: '#d1ddd2', fontSize: 14, lineHeight: 21 }}>
        {action?.reason ?? (workspace?.profile ? 'Run a business check to turn your current priority into one practical next move.' : 'Start with what is on your mind. A few details can help shape a useful first direction.')}
      </Text>
      <View style={{ alignSelf: 'flex-start', marginTop: 1 }}>
        <Button
          title={action ? 'Open your plan' : session ? 'Find your direction' : 'Sign in to begin'}
          onPress={action ? () => router.push('/(tabs)/plan') : openDirection}
          disabled={!action && !canNavigateToOnboarding}
          icon="arrow-forward"
        />
      </View>
    </View>

    <WorkspaceState />

    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <SectionTitle title="This week" subtitle="A manageable step is still progress." />
        <Ionicons accessibilityElementsHidden name="calendar-outline" color={C.green} size={23} />
      </View>
      <Card style={{ gap: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.cardTitle}>{progress.total ? `${progress.completed} of ${progress.total} goals complete` : 'Make room for one meaningful action'}</Text>
            <Copy>{workspace ? `Week of ${formatPlanDate(currentWeekStart())}` : 'Your saved weekly goals will appear here.'}</Copy>
          </View>
          <View accessibilityLabel={progress.total ? `${progress.completed} of ${progress.total} weekly goals complete` : 'No weekly goals yet'} style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: '#edf2e6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={progress.total && progress.completed === progress.total ? 'checkmark-done-outline' : 'leaf-outline'} size={22} color={C.green} />
          </View>
        </View>
        {progress.total > 0 && <View accessibilityRole="progressbar" accessibilityLabel="Weekly goal progress" accessibilityValue={{ min: 0, max: progress.total, now: progress.completed }} style={{ height: 8, backgroundColor: '#e8ece5', borderRadius: 10, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(progress.fraction * 100)}%`, height: '100%', backgroundColor: C.green, borderRadius: 10 }} />
        </View>}
        {weekGoals.length > 0 ? weekGoals.slice(0, 2).map(goal => <View key={goal.id} style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, gap: 7 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <Text style={[s.cardTitle, { flex: 1 }]}>{goal.title}</Text>
            <StatusPill label={goal.status} completed={goal.status === 'completed'} />
          </View>
          <Copy>Due {formatPlanDate(goal.dueDate)}{goal.evaluationMetric ? ` · ${goal.evaluationMetric}` : ''}</Copy>
        </View>) : <Copy>{workspace ? (action ? 'No goals saved for this week yet. Add one when you are ready.' : 'Complete a business check to connect a weekly goal to your next move.') : 'Sign in to see your saved plans and goals.'}</Copy>}
        <Button
          title={weekGoals.length ? 'View weekly plan' : action ? 'Add a weekly goal' : 'Explore your plan'}
          secondary
          onPress={() => weekGoals.length || action ? router.push(action && !weekGoals.length ? '/goal' : '/(tabs)/plan') : openDirection()}
          disabled={!!session && !workspace}
        />
      </Card>
    </View>

    {approved.length > 0 && <View style={{ gap: 14 }}>
      <SectionTitle title="Ready when you are" subtitle="Approved versions saved in this workspace." />
      {approved.map(({ asset, version }) => <Card key={`${asset.id}-${version.version}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#edf2e6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark-circle-outline" size={22} color={C.green} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.cardTitle} numberOfLines={1}>{version.title || asset.kind}</Text>
          <Text numberOfLines={2} style={s.copy}>{asset.channel} · Approved v{version.version}{version.body ? ` · ${version.body}` : ''}</Text>
        </View>
        <Ionicons accessibilityElementsHidden name="chevron-forward" size={18} color={C.muted} />
      </Card>)}
      <Button title="Review your work" secondary onPress={() => router.push('/(tabs)/create')} />
    </View>}

    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Card style={{ flex: 1, backgroundColor: '#edf2e6', padding: 16 }}>
        <Ionicons name="compass-outline" size={21} color={C.green} />
        <Text style={s.cardTitle}>Choose with clarity</Text>
        <Copy>Turn a business question into a useful next step.</Copy>
      </Card>
      <Card style={{ flex: 1, padding: 16 }}>
        <Ionicons name="trending-up-outline" size={21} color={C.green} />
        <Text style={s.cardTitle}>Learn as you go</Text>
        <Copy>Bring real use and results back into focus.</Copy>
      </Card>
    </View>
  </Page>;
}
