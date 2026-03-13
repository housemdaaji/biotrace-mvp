'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, logout } from '@/lib/auth';
import { LeafIcon, HomeIcon, MapIcon, ClipboardIcon, CartIcon, MenuIcon } from '@/components/Icons';

interface GlobalNavProps {
  activePage: 'dashboard' | 'map' | 'survey' | 'eudr' | 'buyers' | 'landing';
}

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard', id: 'dashboard', Icon: HomeIcon },
  { label: 'Map', href: '/map', id: 'map', Icon: MapIcon },
  { label: 'Register', href: '/survey', id: 'survey', Icon: LeafIcon },
  { label: 'Certification', href: '/eudr', id: 'eudr', Icon: ClipboardIcon },
  { label: 'Buyers', href: '/buyers', id: 'buyers', Icon: CartIcon },
];

export default function GlobalNav({ activePage }: GlobalNavProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  function handleSignOut() {
    logout();
    router.push('/login');
    setIsMenuOpen(false);
  }

  const userName = session?.name ?? 'James Kamau';
  const cooperativeName = session?.cooperativeName ?? 'KenyaCoop-B · Meru Central';
  const avatar = session?.avatar ?? 'J';
  const showUserBlock = true;

  return (
    <nav className="sticky top-0 z-50 w-full min-h-14 bg-[#0D3D35] shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between min-h-14 px-4 sm:px-6">
        {/* LEFT: Logo + Nav Links */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
            <span className="font-bold text-xl tracking-tight text-white inline-flex items-center gap-1.5"><LeafIcon className="w-6 h-6" fill="currentColor" /> Mago</span>
            <span className="text-base font-semibold tracking-wide text-white/70">by</span>
            <img
              src="/flahtik-logo.png"
              alt="FLAHTIK"
              className="h-14 w-auto"
              style={{ filter: 'brightness(0) invert(1)', opacity: 1 }}
            />
          </Link>
          {/* Nav links — desktop only */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = activePage === link.id;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#1A7A6E] text-white'
                      : 'text-white/80 hover:bg-[#1A7A6E]/50 hover:text-white'
                  }`}
                >
                  <link.Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/landing"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activePage === 'landing'
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              About Us
            </Link>
          </div>
        </div>

        {/* RIGHT: User + Sign out + Mobile hamburger */}
        <div className="flex items-center gap-3 ml-auto">
          {showUserBlock && (
            <div className="hidden items-center gap-2 lg:flex">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1A7A6E] text-xs font-bold text-white">
                {avatar}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-white">{userName}</span>
                <span className="text-[10px] text-[#0DF5B4] opacity-70">{cooperativeName}</span>
              </div>
              <span className="text-gray-500">|</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-gray-400 transition-colors hover:text-white cursor-pointer"
              >
                Sign out
              </button>
              <span className="text-gray-500">|</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded text-white hover:bg-[#1A7A6E]"
            aria-label="Toggle menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="absolute left-0 top-14 z-50 w-full border-t border-[#1A7A6E] bg-[#0D3D35] shadow-xl md:hidden">
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-2 border-b border-[#1A7A6E]/30 pb-2">
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="block">
                <span className="font-bold text-lg text-white inline-flex items-center gap-1.5"><LeafIcon className="w-5 h-5" fill="currentColor" /> Mago</span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/50">
                <span>powered by</span>
                <img
                  src="/flahtik-logo.png"
                  alt="FLAHTIK"
                  className="h-10 w-auto"
                  style={{ filter: 'brightness(0) invert(1)', opacity: 1 }}
                />
              </div>
            </div>
            {NAV_LINKS.map((link) => {
              const isActive = activePage === link.id;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`rounded px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#1A7A6E] text-white'
                      : 'text-white/80 hover:bg-[#1A7A6E]/50 hover:text-white'
                  }`}
                >
                  <link.Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/landing"
              onClick={() => setIsMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              About Us
            </Link>
            {showUserBlock && (
              <>
                <div className="my-2 flex items-center gap-2 border-t border-[#1A7A6E]/50 pt-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A7A6E] text-sm font-bold text-white">
                    {avatar}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm text-white">{userName}</span>
                    <span className="text-xs text-[#0DF5B4] opacity-70">{cooperativeName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded px-4 py-2.5 text-left text-sm text-gray-400 hover:bg-[#1A7A6E]/30 hover:text-white"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
