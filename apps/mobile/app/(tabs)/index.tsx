import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { C, Copy, Eyebrow, Logo, Page, s } from '@/components/nexora/ui';
import { WorkspaceState, WorkspaceUnavailable } from '@/components/nexora/workspace-state';
import { client, useNexora } from '@/lib/nexora/context';
import { approvedAssets, currentWeekStart, formatPlanDate, plansForCurrentWeek, weekProgress } from '@/lib/nexora/planning';

function todayLabel() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function QuietAction({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, opacity: pressed ? 0.72 : 1 })}>
    <Text style={{ color: C.green, fontSize: 13, fontWeight: '800' }}>{title}</Text>
    <Ionicons name="arrow-forward" size={17} color={C.green} />
  </Pressable>;
}

export default function Home() {
  const { workspace, session, loading } = useNexora();
  const action = workspace?.assessments.at(-1)?.recommendedActions[0];
  const weekGoals = workspace ? plansForCurrentWeek(workspace.weeklyPlans) : [];
  const progress = weekProgress(weekGoals);
  const approved = workspace ? approvedAssets(workspace.assets).slice(0, 1) : [];
  const canStartCheck = !!client.origin && !!session && !!workspace && !loading;

  if (!session || !workspace) return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Logo />
      <Text style={{ color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{todayLabel().toUpperCase()}</Text>
    </View>
    <View style={{ gap: 8, paddingTop: 6 }}>
      <Text accessibilityRole="header" style={{ color: C.ink, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1.3 }}>A clearer week{ '\n' }starts with focus.</Text>
      <Copy>Less second-guessing. One useful step at a time.</Copy>
    </View>
    <WorkspaceUnavailable />
    <View style={{ gap: 7, paddingTop: 2 }}>
      <Eyebrow>THE NEXORA RHYTHM</Eyebrow>
      {[
        ['01', 'Find your focus', 'Name the business question that matters now.'],
        ['02', 'Choose one next move', 'Turn your priority into a step for this week.'],
        ['03', 'Learn from what you do', 'Bring real use and results back into your plan.'],
      ].map(([number, title, description], index) => <View key={number} style={{ minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 13, borderTopWidth: 1, borderTopColor: '#e6e9e2', marginTop: index === 0 ? 5 : 0 }}>
        <Text style={{ width: 27, color: '#84927f', fontSize: 11, fontWeight: '800' }}>{number}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: C.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>{title}</Text>
          <Text style={{ color: C.muted, fontSize: 12, lineHeight: 17 }}>{description}</Text>
        </View>
      </View>)}
    </View>
  </Page>;

  return <Page>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Logo />
      <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: '#e8eddf', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="leaf-outline" size={19} color={C.green} />
      </View>
    </View>

    <View style={{ gap: 8, paddingTop: 5 }}>
      <Eyebrow>{todayLabel().toUpperCase()}</Eyebrow>
      <Text accessibilityRole="header" style={{ color: C.ink, fontSize: 32, lineHeight: 37, fontWeight: '700', letterSpacing: -1.3 }}>Your week,{ '\n' }with more clarity.</Text>
      <Copy>One thoughtful move can change the shape of a week.</Copy>
    </View>

    <View style={{ backgroundColor: C.dark, borderRadius: 25, padding: 22, gap: 13, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', right: -70, top: -80, width: 210, height: 210, borderRadius: 110, borderWidth: 1, borderColor: '#d5ef9122' }} />
      <View pointerEvents="none" style={{ position: 'absolute', right: -36, top: -46, width: 142, height: 142, borderRadius: 75, borderWidth: 1, borderColor: '#d5ef9122' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.lime }} />
        <Text style={{ color: '#c7d8bd', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>YOUR NEXT MOVE</Text>
      </View>
      <Text style={{ color: '#f6f8ef', fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.55 }}>
        {action?.title ?? (workspace?.profile ? 'Find the clearest opportunity.' : 'Your next step starts here.')}
      </Text>
      <Text style={{ color: '#d1ddd2', fontSize: 13, lineHeight: 20 }}>
        {action?.reason ?? (workspace ? 'Your saved business direction is ready for a focused check.' : 'A focused recommendation will appear here when your workspace is connected.')}
      </Text>
      {action ? <View style={{ alignSelf: 'flex-start', paddingTop: 1 }}><QuietAction title="See the plan" onPress={() => router.push('/(tabs)/plan')} /></View> : canStartCheck ? <View style={{ alignSelf: 'flex-start', paddingTop: 1 }}><QuietAction title="Start a business check" onPress={() => router.push('/onboarding')} /></View> : null}
    </View>

    <WorkspaceState />

    <View style={{ gap: 13 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 4 }}>
          <Text accessibilityRole="header" style={s.section}>This week</Text>
          <Copy>{progress.total ? `${progress.completed} of ${progress.total} steps complete` : 'Choose one meaningful thing to move forward.'}</Copy>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open your weekly plan" onPress={() => router.push('/(tabs)/plan')} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-forward-circle-outline" size={27} color={C.green} />
        </Pressable>
      </View>

      <View style={{ backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 21, padding: 17, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View accessibilityLabel={progress.total ? `${progress.completed} of ${progress.total} goals complete` : 'No goals saved for this week'} style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 4, borderColor: progress.total && progress.completed === progress.total ? '#9cbd70' : '#e8eddf', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.green, fontSize: 12, fontWeight: '800' }}>{progress.total ? `${Math.round(progress.fraction * 100)}%` : '—'}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.cardTitle}>{progress.total ? 'Your weekly rhythm' : 'A fresh page'}</Text>
            <Copy>{`Week of ${formatPlanDate(currentWeekStart())}`}</Copy>
          </View>
        </View>

        {weekGoals.length ? <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 5 }}>
          {weekGoals.slice(0, 3).map((goal, index) => <View key={goal.id} accessible accessibilityRole="text" accessibilityLabel={`${goal.title}. ${goal.status.replace('_', ' ')}. Due ${formatPlanDate(goal.dueDate)}.`} style={{ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: index < Math.min(weekGoals.length, 3) - 1 ? 1 : 0, borderBottomColor: '#edf0ea' }}>
            <Ionicons name={goal.status === 'completed' ? 'checkmark-circle' : goal.status === 'in_progress' ? 'radio-button-on' : 'ellipse-outline'} size={19} color={goal.status === 'completed' ? C.green : '#879388'} />
            <Text numberOfLines={2} style={{ flex: 1, color: C.ink, fontSize: 13, lineHeight: 18, fontWeight: '600' }}>{goal.title}</Text>
            <Text style={{ color: C.muted, fontSize: 11 }}>{formatPlanDate(goal.dueDate)}</Text>
          </View>)}
          {weekGoals.length > 3 && <QuietAction title={`View all ${weekGoals.length} goals`} onPress={() => router.push('/(tabs)/plan')} />}
        </View> : <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 11, gap: 2 }}>
          <Text style={s.cardTitle}>{workspace ? 'No goals on the calendar yet' : client.origin && !session ? 'Your plan is ready when you are' : 'Your plan will take shape here'}</Text>
          <Copy>{workspace ? 'Add one small, clear step when you’re ready.' : client.origin && !session ? 'Sign in to see your saved goals.' : 'Connect your workspace to load saved goals.'}</Copy>
          {action && <QuietAction title="Add a weekly goal" onPress={() => router.push('/goal')} />}
          {!action && canStartCheck && <QuietAction title="Set your direction" onPress={() => router.push('/onboarding')} />}
        </View>}
      </View>
    </View>

    {approved.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Review your approved work" onPress={() => router.push('/(tabs)/create')} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 78, paddingHorizontal: 15, borderRadius: 18, backgroundColor: '#e9efe1', opacity: pressed ? 0.8 : 1 })}>
      <View style={{ width: 39, height: 39, borderRadius: 13, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark-circle-outline" size={21} color={C.green} /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: C.ink, fontSize: 13, fontWeight: '800' }}>Approved and ready</Text>
        <Text numberOfLines={1} style={{ color: C.muted, fontSize: 12 }}>{approved[0].version.title || approved[0].asset.kind} · {approved[0].asset.channel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.green} />
    </Pressable>}
  </Page>;
}
