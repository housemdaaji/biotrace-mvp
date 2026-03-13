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
import SentinelPanel, { type SentinelResult } from '@/components/SentinelPanel';

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
    <main className="bg-white">
      <GlobalNav activePage="map" />
      
      <div className="relative w-full" style={{ height: 'calc(100vh - 56px)', marginTop: '0' }}>
        <MapView
          farms={farms}
          cooperatives={cooperatives}
          ndviTemporalData={ndviTemporalData}
          isDrawing={drawMode}
          onBBoxDrawn={setPendingBBox}
          sentinelResult={sentinelResult}
          onFarmSelected={setIsFarmSelected}
        />

        <style>{`
          .leaflet-top.leaflet-left .leaflet-control-zoom {
            margin-top: 60px;
            margin-left: 10px;
          }
          .sentinel-panel-container > div {
            right: 280px !important;
            transition: right 0.3s ease !important;
          }
        `}</style>
        
        <div className="sentinel-panel-container">
          <SentinelPanel
            onResult={setSentinelResult}
            onDrawMode={setDrawMode}
            isDrawing={drawMode}
            pendingBBox={pendingBBox}
            onBBoxConsumed={() => setPendingBBox(null)}
          />
        </div>
      </div>
    </main>
  );
}
