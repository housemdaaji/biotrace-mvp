export const DEMO_ACCOUNTS = [
  {
    email: 'alice@kenyacoop-a.com',
    password: 'demo2026',
    name: 'Alice Mwangi',
    cooperativeId: 'kenyacoop-a',
    cooperativeName: 'KenyaCoop-A — Meru North',
    role: 'manager' as const,
    avatar: 'A',
  },
  {
    email: 'james@kenyacoop-b.com',
    password: 'demo2026',
    name: 'James Kamau',
    cooperativeId: 'kenyacoop-b',
    cooperativeName: 'KenyaCoop-B — Meru Central',
    role: 'manager' as const,
    avatar: 'J',
  },
  {
    email: 'grace@kenyacoop-c.com',
    password: 'demo2026',
    name: 'Grace Njiru',
    cooperativeId: 'kenyacoop-c',
    cooperativeName: 'KenyaCoop-C — Meru South',
    role: 'manager' as const,
    avatar: 'G',
  },
  {
    email: 'admin@biotrace.app',
    password: 'demo2026',
    name: 'Housem Daaji',
    cooperativeId: 'all',
    cooperativeName: 'All Cooperatives (Admin)',
    role: 'admin' as const,
    avatar: 'H',
  },
] as const;

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];

const SESSION_KEY = 'biotrace_session';

export function login(email: string, password: string): DemoAccount | null {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  );
  if (account) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    }
    return account as DemoAccount;
  }
  return null;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): DemoAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoAccount) : null;
  } catch {
    return null;
  }
}
