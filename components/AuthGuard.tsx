'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, type DemoAccount } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<DemoAccount | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/login');
    } else {
      setSession(s);
    }
    setChecking(false);
  }, [router]);

  if (checking || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1A7A6E] border-t-transparent" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
