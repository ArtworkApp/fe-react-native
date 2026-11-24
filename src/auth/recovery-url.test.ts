import { recoveryUrl } from './recovery-url';

describe('recoveryUrl', () => {
  it('builds the fixed recovery path from a configured HTTPS origin', () => {
    expect(recoveryUrl('https://art.example.com/', false)).toBe('https://art.example.com/forgot-password');
  });

  it('allows a local development HTTP origin only in development', () => {
    expect(recoveryUrl('http://192.168.1.8:3000', true)).toBe('http://192.168.1.8:3000/forgot-password');
    expect(recoveryUrl('http://192.168.1.8:3000', false)).toBeNull();
  });

  it.each([undefined, '', 'not a url', 'javascript:alert(1)', 'https://user:pass@example.com', 'https://example.com/path', 'https://example.com?next=other', 'https://example.com#token=secret'])(
    'rejects missing or non-origin configuration', (origin) => {
      expect(recoveryUrl(origin, false)).toBeNull();
    },
  );
});
