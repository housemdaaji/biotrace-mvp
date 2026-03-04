import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import farmsData from '@/data/farms.json';
import cooperativesData from '@/data/cooperatives.json';
import ndviGridData from '@/data/ndvi_grid.json';
import type { Farm, Cooperative } from './types';
import type { NdviTemporalData } from './MapView';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

export default function MapPage() {
  const farms = farmsData as Farm[];
  const cooperatives = cooperativesData as Cooperative[];
  const ndviTemporalData = ndviGridData as unknown as NdviTemporalData;

  return (
    <main className="flex min-h-0 flex-col bg-white" style={{ height: 'calc(100vh - 4rem)' }}>
      <header className="flex shrink-0 flex-col gap-1 border-b border-gray-200 px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Geospatial Intelligence Map
        </h1>
        <p className="text-sm text-gray-600">
          Live satellite monitoring — Meru County, Kenya
        </p>
      </header>

      <div className="min-h-0 flex-1">
        <MapView farms={farms} cooperatives={cooperatives} ndviTemporalData={ndviTemporalData} />
      </div>
    </main>
  );
}
