'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#060A08] flex items-center justify-center">
      <p className="text-[#0DF5B4] text-sm">
        Loading Mago...
      </p>
    </div>
  );
}
