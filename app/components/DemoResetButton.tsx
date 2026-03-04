'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoResetButton() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    router.push('/');
    await new Promise((r) => setTimeout(r, 800));
    router.push('/map');
    setResetting(false);
  }

  return (
    <button
      type="button"
      onClick={handleReset}
      disabled={resetting}
      className="flex items-center gap-2 rounded-lg border border-[#1A7A6E] bg-white px-4 py-2 text-sm font-medium text-[#1A7A6E] hover:bg-[#f0faf9] transition-colors disabled:opacity-50"
    >
      {resetting ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-[#1A7A6E] border-t-transparent"
            aria-hidden
          />
          Resetting...
        </>
      ) : (
        <>🔄 Load Demo Data</>
      )}
    </button>
  );
}
