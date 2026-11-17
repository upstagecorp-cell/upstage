export type Action = { id: string; title: string; reason: string; kind: string; metric: string };
export type Assessment = { id: string; createdAt: string; recommendedActions: Action[]; opportunities?: {description: string}[]; missingInformation?: string[] };
export type Plan = { id: string; title: string; status: 'planned'|'in_progress'|'completed'|'cancelled'; dueDate: string; weekStart: string; evaluationMetric: string; notes: string };
export type Asset = { id: string; kind: string; currentVersion: number; channel: string; versions: { version: number; title: string; body: string; reviewStatus: 'draft'|'approved' }[] };
export type Result = { id: string; metric: string; value: number; unit: string; currency: string | null; periodStart: string; periodEnd: string; sourceNote: string };
export type Workspace = { profile: { id: string; version: number; name: string; offering: string; goal: string; customerType?: string; questionAnswers?: Record<string,string> } | null; assessments: Assessment[]; weeklyPlans: Plan[]; assets: Asset[]; results: Result[]; executions: {id: string; channel: string; usedAt: string}[]; generationAvailable: boolean };
export function workspaceFromResponse(value: unknown): Workspace {
  const outer = value as { workspace?: unknown } | null;
  const w = outer?.workspace as Workspace | undefined;
  const str = (v: unknown) => typeof v === 'string';
  const valid = !!w && (w.profile === null || (!!w.profile && str(w.profile.id) && Number.isInteger(w.profile.version))) &&
    Array.isArray(w.assessments) && w.assessments.every(a => !!a && str(a.id) && Array.isArray(a.recommendedActions) && a.recommendedActions.every(x => !!x && str(x.id) && str(x.title) && str(x.reason) && str(x.kind) && str(x.metric))) &&
    Array.isArray(w.weeklyPlans) && w.weeklyPlans.every(p => !!p && str(p.id) && str(p.title) && str(p.status) && str(p.dueDate) && str(p.evaluationMetric)) &&
    Array.isArray(w.assets) && w.assets.every(a => !!a && str(a.id) && str(a.kind) && str(a.channel) && Number.isInteger(a.currentVersion) && Array.isArray(a.versions) && a.versions.every(v => !!v && Number.isInteger(v.version) && str(v.title) && str(v.body) && str(v.reviewStatus))) &&
    Array.isArray(w.results) && w.results.every(r => !!r && str(r.id) && str(r.metric) && typeof r.value === 'number' && str(r.unit) && str(r.periodStart) && str(r.periodEnd)) &&
    Array.isArray(w.executions) && w.executions.every(e => !!e && str(e.id) && str(e.channel) && str(e.usedAt)) && typeof w.generationAvailable === 'boolean';
  if (!valid) throw new Error('The workspace response is incomplete. Please try again later.');
  return w;
}
