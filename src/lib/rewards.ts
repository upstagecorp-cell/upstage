import type { ExecutionRecord, WeeklyGoal } from '@/data/types'

export interface RewardItem {
  id: string
  title: string
  description: string
  requiredCount: number
  unlocked: boolean
}

export interface RewardState {
  completedCount: number
  evidenceCount: number
  weeklyGoalCompleted: boolean
  unlockedRewards: RewardItem[]
  nextReward: RewardItem | null
}

const REWARD_RULES: Omit<RewardItem, 'unlocked'>[] = [
  {
    id: 'detail_analysis',
    title: '상세 원인 분석 제공',
    description: '첫 실행을 기록하면 관련 지표의 상세 원인 분석을 더 볼 수 있습니다.',
    requiredCount: 1,
  },
  {
    id: 'weekly_priority',
    title: '주간 개선 방향 제공',
    description: '실행 3개를 기록하면 이번 주 우선순위와 다음 액션을 받을 수 있습니다.',
    requiredCount: 3,
  },
  {
    id: 'benchmark_pack',
    title: '업종 체크리스트 제공',
    description: '실행 5개를 기록하면 내 업종에 맞는 점검 체크리스트를 받을 수 있습니다.',
    requiredCount: 5,
  },
  {
    id: 'monthly_report',
    title: '월간 성장 리포트 제공',
    description: '실행 10개를 기록하면 개선된 지표와 다음 달 과제를 볼 수 있습니다.',
    requiredCount: 10,
  },
]

export function getRewardState(
  executionRecords: ExecutionRecord[],
  weeklyGoal: WeeklyGoal | null
): RewardState {
  const completedCount = executionRecords.length
  const evidenceCount = executionRecords.filter((record) => Boolean(record.evidence)).length
  const weeklyGoalCompleted = Boolean(
    weeklyGoal &&
      weeklyGoal.targetActions.length > 0 &&
      weeklyGoal.targetActions.every((actionId) =>
        executionRecords.some((record) => record.action_id === actionId)
      )
  )

  const rewards = REWARD_RULES.map((reward) => ({
    ...reward,
    unlocked: completedCount >= reward.requiredCount,
  }))

  return {
    completedCount,
    evidenceCount,
    weeklyGoalCompleted,
    unlockedRewards: rewards.filter((reward) => reward.unlocked),
    nextReward: rewards.find((reward) => !reward.unlocked) ?? null,
  }
}

export function getRewardMessage(executionRecords: ExecutionRecord[]): string {
  const count = executionRecords.length
  const newlyUnlocked = REWARD_RULES.find((reward) => reward.requiredCount === count)

  if (newlyUnlocked) {
    return `${newlyUnlocked.title}을 받을 수 있습니다. ${newlyUnlocked.description}`
  }

  const nextReward = REWARD_RULES.find((reward) => reward.requiredCount > count)
  if (!nextReward) {
    return '실행 기록이 충분히 쌓였습니다. 월간 성장 리포트에서 변화 흐름을 확인할 수 있습니다.'
  }

  return `좋습니다. ${nextReward.title}까지 ${nextReward.requiredCount - count}개 실행이 남았습니다.`
}
