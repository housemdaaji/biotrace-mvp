'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DEMO_ACCOUNTS,
  login,
  getSession,
  type DemoAccount,
} from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace('/dashboard');
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const account = login(email.trim().toLowerCase(), password);
    if (account) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password. Use a demo account below.');
      setLoading(false);
    }
  }

  function quickLogin(account: DemoAccount) {
    login(account.email, account.password);
    router.push('/dashboard');
  }

  const demoAccounts = DEMO_ACCOUNTS.filter((a) => a.role === 'manager');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f0faf9] to-white px-4 py-12">
      <div className="mb-8 text-center">
        <span className="text-3xl font-bold text-[#1A7A6E]">🌿 BioTrace</span>
        <p className="mt-1 text-sm text-gray-500">Cooperative Manager Portal</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-6 text-lg font-semibold text-gray-900">
          Sign in to your account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#1A7A6E]/40 ${
                error ? 'border-red-400' : 'border-gray-300 focus:border-[#1A7A6E]'
              }`}
              placeholder="alice@kenyacoop-a.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-[#1A7A6E]/40 ${
                  error ? 'border-red-400' : 'border-gray-300 focus:border-[#1A7A6E]'
                }`}
                placeholder="demo2026"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs text-gray-400 hover:text-gray-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1A7A6E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#15635A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400">Demo Credentials</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="space-y-2">
          <p className="mb-2 text-xs text-gray-400">
            All accounts use password:{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">
              demo2026
            </code>
          </p>
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => quickLogin(account)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-xs transition hover:border-[#1A7A6E] hover:bg-[#f0faf9]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1A7A6E] text-xs font-bold text-white">
                  {account.avatar}
                </span>
                <div>
                  <p className="font-medium text-gray-700">{account.name}</p>
                  <p className="text-gray-400">{account.cooperativeName}</p>
                </div>
              </div>
              <span className="flex-shrink-0 font-semibold text-[#1A7A6E]">
                Login →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="mb-2 text-xs text-gray-400">
            Public pages — no login required:
          </p>
          <div className="flex gap-3">
            <Link
              href="/map"
              className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-xs font-medium text-gray-600 transition hover:border-[#1A7A6E] hover:text-[#1A7A6E]"
            >
              🗺 View Map
            </Link>
            <Link
              href="/buyers"
              className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-xs font-medium text-gray-600 transition hover:border-[#1A7A6E] hover:text-[#1A7A6E]"
            >
              🌍 Buyer Portal
            </Link>
            <Link
              href="/survey"
              className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-xs font-medium text-gray-600 transition hover:border-[#1A7A6E] hover:text-[#1A7A6E]"
            >
              📋 Survey
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
