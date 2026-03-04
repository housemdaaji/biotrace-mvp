'use client';

import { useRouter } from 'next/navigation';
import { getSession, logout } from '@/lib/auth';

export default function SessionBar() {
  const router = useRouter();
  const session = getSession();
  if (!session) return null;

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="border-b border-[#1A7A6E]/15 bg-[#1A7A6E]/5 px-4 py-2">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1A7A6E] text-xs font-bold text-white">
            {session.avatar}
          </span>
          <span className="text-xs text-gray-600">
            Signed in as{' '}
            <span className="font-semibold text-gray-800">{session.name}</span>
          </span>
          <span className="hidden rounded-full bg-[#1A7A6E]/10 px-2 py-0.5 text-xs text-[#1A7A6E] sm:inline">
            {session.cooperativeName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-gray-400 transition-colors hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
