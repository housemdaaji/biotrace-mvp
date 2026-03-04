'use client';

import { Suspense } from 'react';

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0faf9] to-white">
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading survey...</div>}>
        {children}
      </Suspense>
    </div>
  );
}
