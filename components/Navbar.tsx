'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DemoResetButton from '@/app/components/DemoResetButton';
import { getSession } from '@/lib/auth';

const navLinks = [
  { href: '/map', label: 'Map' },
  { href: '/survey', label: '📋 Survey' },
  { href: '/buyers', label: 'Buyers' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);

  useEffect(() => {
    setSession(getSession());
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold text-[#1A7A6E] hover:text-[#145c52] transition-colors"
        >
          BioTrace
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-400 sm:block">Demo Mode</span>
            <DemoResetButton />
          </div>
          <Link
            href="/map"
            className={`text-sm font-medium transition-colors ${
              pathname === '/map'
                ? 'text-[#1A7A6E] underline decoration-2 underline-offset-4'
                : 'text-gray-600 hover:text-[#1A7A6E]'
            }`}
          >
            Map
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'text-[#1A7A6E] underline decoration-2 underline-offset-4'
                  : 'text-gray-600 hover:text-[#1A7A6E]'
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-[#1A7A6E] px-3 py-1.5 text-sm font-medium text-[#1A7A6E] transition hover:bg-[#f0faf9]"
            >
              Manager Login
            </Link>
          )}
          {navLinks.slice(1).map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#1A7A6E] underline decoration-2 underline-offset-4'
                    : 'text-gray-600 hover:text-[#1A7A6E]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
