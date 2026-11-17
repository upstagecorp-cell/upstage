import { describe, expect, it } from 'vitest';
import { activePlans, approvedAssets, currentWeekStart, formatPlanDate, plansForCurrentWeek, weekProgress } from '../lib/nexora/planning';
import type { Asset, Plan } from '../lib/nexora/types';

const plan = (id: string, values: Partial<Plan> = {}): Plan => ({
  id, title: id, status: 'planned', dueDate: '2026-11-20', weekStart: '2026-11-16', evaluationMetric: '', notes: '', ...values,
});

describe('Home and Plan derived data', () => {
  it('starts the week on Monday using the device local calendar', () => {
    expect(currentWeekStart(new Date(2026, 10, 17, 9))).toBe('2026-11-16');
    expect(currentWeekStart(new Date(2026, 10, 22, 23))).toBe('2026-11-16');
    expect(currentWeekStart(new Date(2026, 10, 23, 0))).toBe('2026-11-23');
  });

  it('shows only non-cancelled goals assigned to the current week', () => {
    const goals = [
      plan('current'),
      plan('completed', { status: 'completed' }),
      plan('cancelled', { status: 'cancelled' }),
      plan('older-week', { weekStart: '2026-11-09' }),
    ];
    expect(plansForCurrentWeek(goals, new Date(2026, 10, 17))).toEqual([goals[0], goals[1]]);
  });

  it('calculates progress without counting cancelled goals', () => {
    expect(weekProgress([plan('done', { status: 'completed' }), plan('open'), plan('cancelled', { status: 'cancelled' })]))
      .toEqual({ total: 2, completed: 1, remaining: 1, fraction: 0.5 });
    expect(weekProgress([])).toEqual({ total: 0, completed: 0, remaining: 0, fraction: 0 });
  });

  it('orders active work by in-progress state and then nearest due date', () => {
    const goals = [plan('later', { dueDate: '2026-11-30' }), plan('doing', { status: 'in_progress', dueDate: '2026-11-25' }), plan('soon', { dueDate: '2026-11-18' }), plan('done', { status: 'completed' })];
    expect(activePlans(goals).map(item => item.id)).toEqual(['doing', 'soon', 'later']);
  });

  it('uses the newest approved version without treating a newer draft as approved', () => {
    const asset: Asset = {
      id: 'asset-1', kind: 'caption', currentVersion: 3, channel: 'Instagram',
      versions: [
        { version: 1, title: 'Old approved', body: 'v1', reviewStatus: 'approved' },
        { version: 2, title: 'Newer approved', body: 'v2', reviewStatus: 'approved' },
        { version: 3, title: 'Draft only', body: 'v3', reviewStatus: 'draft' },
      ],
    };
    expect(approvedAssets([asset])[0].version.title).toBe('Newer approved');
    expect(approvedAssets([{ ...asset, id: 'draft', versions: [{ version: 1, title: 'Draft', body: '', reviewStatus: 'draft' }] }])).toEqual([]);
  });

  it('formats valid date-only values and leaves invalid values visible', () => {
    expect(formatPlanDate('2026-11-20')).toBe('Nov 20');
    expect(formatPlanDate('2026-99-40')).toBe('2026-99-40');
    expect(formatPlanDate('date pending')).toBe('date pending');
  });
});
