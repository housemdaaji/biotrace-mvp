'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import GlobalNav from '@/components/GlobalNav';
import farmsData from '@/data/farms.json';
import cooperativesData from '@/data/cooperatives.json';
import ndviGridData from '@/data/ndvi_grid.json';
import type { Farm, Cooperative } from './types';
import type { NdviTemporalData } from './MapView';
import type { SentinelResult } from '@/components/SentinelPanel';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

const REGISTERED_FARMS_KEY = 'biotrace_registered_farms';

export default function MapPage() {
  const staticFarms = farmsData as Farm[];
  const [farms, setFarms] = useState<Farm[]>(staticFarms);
  const cooperatives = cooperativesData as Cooperative[];
  const ndviTemporalData = ndviGridData as unknown as NdviTemporalData;
  const [drawMode, setDrawMode] = useState(false);
  const [pendingBBox, setPendingBBox] = useState<[number, number, number, number] | null>(null);
  const [sentinelResult, setSentinelResult] = useState<SentinelResult | null>(null);
  const [isFarmSelected, setIsFarmSelected] = useState(false);
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [sentinelError, setSentinelError] = useState('');

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

  async function handleAnalyzeArea({
    index,
    dateFrom,
    dateTo,
    bbox,
  }: {
    index: string;
    dateFrom: string;
    dateTo: string;
    bbox: number[] | null;
  }) {
    if (!bbox) return;
    setSentinelLoading(true);
    setSentinelError('');
    setSentinelResult(null);
    try {
      const res = await fetch('/api/sentinel/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bbox,
          index,
          dateFrom,
          dateTo,
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      const result: SentinelResult = {
        image: data.image,
        bbox: bbox as [number, number, number, number],
        index,
        dateFrom,
        dateTo,
      };
      setSentinelResult(result);
    } catch (e: unknown) {
      setSentinelError(e instanceof Error ? e.message : 'Fetch failed');
      setSentinelResult(null);
    } finally {
      setSentinelLoading(false);
    }
  }

  return (
    <main className="bg-white">
      <GlobalNav activePage="map" />
      
      <div className="relative w-full" style={{ height: 'calc(100vh - 56px)', marginTop: '0' }}>
        <MapView
          farms={farms}
          cooperatives={cooperatives}
          ndviTemporalData={ndviTemporalData}
          isDrawing={drawMode}
          onDrawMode={(active: boolean) => setDrawMode(active)}
          onBBoxDrawn={setPendingBBox}
          sentinelResult={sentinelResult}
          onFarmSelected={setIsFarmSelected}
          onAnalyzeArea={handleAnalyzeArea}
        />

      </div>
    </main>
  );
}
