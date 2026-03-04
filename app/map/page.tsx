'use client';

import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import farmsData from '@/data/farms.json';
import cooperativesData from '@/data/cooperatives.json';
import ndviGridData from '@/data/ndvi_grid.json';
import type { Farm, Cooperative } from './types';
import type { NdviTemporalData } from './MapView';
import DemoResetButton from '@/app/components/DemoResetButton';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

const REGISTERED_FARMS_KEY = 'biotrace_registered_farms';

export default function MapPage() {
  const staticFarms = farmsData as Farm[];
  const [farms, setFarms] = useState<Farm[]>(staticFarms);
  const cooperatives = cooperativesData as Cooperative[];
  const ndviTemporalData = ndviGridData as unknown as NdviTemporalData;

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(REGISTERED_FARMS_KEY) : null;
      if (!raw) return;
      const registered = JSON.parse(raw) as Farm[];
      setFarms([...staticFarms, ...registered]);
    } catch {
      // ignore invalid stored data
    }
  }, [staticFarms]);

  return (
    <main className="flex min-h-0 flex-col bg-white" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <h1 className="text-sm font-medium text-gray-600">
          📍 Meru County, Kenya — Coffee Growing Region
        </h1>
        <DemoResetButton />
      </div>

      <div className="min-h-0 flex-1">
        <MapView farms={farms} cooperatives={cooperatives} ndviTemporalData={ndviTemporalData} />
      </div>
    </main>
  );
}
