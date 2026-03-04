'use client';

import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import farmsData from '@/data/farms.json';
import cooperativesData from '@/data/cooperatives.json';
import ndviGridData from '@/data/ndvi_grid.json';
import type { Farm, Cooperative } from './types';
import type { NdviTemporalData } from './MapView';
import DemoResetButton from '@/app/components/DemoResetButton';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

export default function MapPage() {
  const farms = farmsData as Farm[];
  const cooperatives = cooperativesData as Cooperative[];
  const ndviTemporalData = ndviGridData as unknown as NdviTemporalData;

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
