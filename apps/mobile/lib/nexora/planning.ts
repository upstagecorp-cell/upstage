import type { Asset, Plan } from './types';

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Monday for the device's current local week, represented as YYYY-MM-DD. */
export function currentWeekStart(now = new Date()): string {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return localDateKey(monday);
}

export function plansForCurrentWeek(plans: Plan[], now = new Date()): Plan[] {
  const weekStart = currentWeekStart(now);
  return plans.filter(plan => plan.weekStart === weekStart && plan.status !== 'cancelled');
}

export function activePlans(plans: Plan[]): Plan[] {
  return plans
    .filter(plan => plan.status === 'planned' || plan.status === 'in_progress')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in_progress' ? -1 : 1;
      return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title);
    });
}

export function weekProgress(plans: Plan[]) {
  const tracked = plans.filter(plan => plan.status !== 'cancelled');
  const completed = tracked.filter(plan => plan.status === 'completed').length;
  return {
    total: tracked.length,
    completed,
    remaining: tracked.length - completed,
    fraction: tracked.length ? completed / tracked.length : 0,
  };
}

export function approvedVersion(asset: Asset) {
  return asset.versions
    .filter(version => version.reviewStatus === 'approved')
    .sort((a, b) => b.version - a.version)[0];
}

export function approvedAssets(assets: Asset[]) {
  return assets
    .map(asset => ({ asset, version: approvedVersion(asset) }))
    .filter((item): item is { asset: Asset; version: NonNullable<ReturnType<typeof approvedVersion>> } => !!item.version);
}

export function formatPlanDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  if (!Number.isFinite(date.getTime()) || date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}
