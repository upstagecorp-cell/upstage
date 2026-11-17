import { describe, expect, it } from 'vitest';
import { formatMetric } from '../lib/nexora/format';
import { workspaceFromResponse } from '../lib/nexora/types';

describe('mobile domain',()=>{
  it('uses each currency’s own minor unit without relabeling money',()=>{
    expect(formatMetric(10000,'minor','KRW')).toMatch(/10,000/);
    expect(formatMetric(10000,'minor','USD')).toMatch(/100\.00/);
    expect(formatMetric(10000,'minor',null)).toContain('minor units');
  });
  it('rejects incomplete or malformed workspaces',()=>{
    expect(()=>workspaceFromResponse({workspace:{profile:null,assessments:[{id:'a'}],weeklyPlans:[],assets:[],results:[],executions:[],generationAvailable:false}})).toThrow();
    expect(()=>workspaceFromResponse({workspace:{profile:null,assessments:[],weeklyPlans:[],assets:[],results:[],executions:[],generationAvailable:false}})).not.toThrow();
  });
});
