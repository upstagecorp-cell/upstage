import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('security-sensitive screen wiring', () => {
  it('leaves the legacy OAuth callback inert and sends users to NEXORA email login', () => {
    const callback = source('app/oauth/callback.tsx');
    expect(callback).toContain('No session was created');
    expect(callback).toContain("router.replace('/login')");
    expect(callback).not.toMatch(/setSessionToken|setUserInfo|useLocalSearchParams|exchangeOAuthCode|getInitialURL/);
  });
  it('requires a request-bound creation receipt for every create screen', () => {
    for (const [path, collection] of [
      ['app/(tabs)/create.tsx', 'assets'],
      ['app/goal.tsx', 'weeklyPlans'],
      ['app/record-result.tsx', 'results'],
      ['app/onboarding.tsx', 'assessments'],
    ]) {
      const screen = source(path);
      expect(screen).toContain('clientRequestId:');
      expect(screen).toContain(`collection:'${collection}'`);
      expect(screen).not.toMatch(/before\.has\(/);
    }
  });
  it('places secure-storage warnings above navigation and limits logout scope', () => {
    const layout = source('app/_layout.tsx');
    expect(layout).toContain('securityWarning'); expect(layout).toContain('retrySecureCleanup');
    const account = source('app/(tabs)/account.tsx');
    expect(account).toContain('mobile session family'); expect(account).toContain('other mobile families and web sessions');
    expect(account).not.toMatch(/all devices|sign out everywhere/i);
  });
});
