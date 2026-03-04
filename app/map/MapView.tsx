'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Rectangle } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { Farm, Cooperative } from './types';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const CENTER: [number, number] = [0.05, 37.65];
const ZOOM = 11;

function getParcelColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getNdviColor(ndvi: number): string {
  if (ndvi > 0.6) return '#15803d';
  if (ndvi >= 0.4) return '#86efac';
  if (ndvi >= 0.2) return '#fde047';
  return '#ef4444';
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#1A7A6E';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function formatStatus(status: string): string {
  if (status === 'certified') return 'Certified';
  if (status === 'pending') return 'Pending';
  if (status === 'at-risk') return 'At-Risk';
  return status;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export interface NdviCell {
  id: string;
  lat: number;
  lng: number;
  ndvi: number;
  bounds: [[number, number], [number, number]];
}

interface MapViewProps {
  farms: Farm[];
  cooperatives: Cooperative[];
  ndviGrid: NdviCell[];
}

export default function MapView({ farms, cooperatives, ndviGrid }: MapViewProps) {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [ndviLayerVisible, setNdviLayerVisible] = useState(true);

  const coopById = useMemo(() => {
    const m = new Map<string, Cooperative>();
    cooperatives.forEach((c) => m.set(c.id, c));
    return m;
  }, [cooperatives]);

  const farmById = useMemo(() => {
    const m = new Map<string, Farm>();
    farms.forEach((f) => m.set(f.id, f));
    return m;
  }, [farms]);

  const farmsWithBoundary = useMemo(() => farms.filter((f) => f.boundary), [farms]);

  const parcelsFeatureCollection = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: farmsWithBoundary.map((farm) => ({
      type: 'Feature' as const,
      geometry: farm.boundary,
      properties: { id: farm.id, apsScore: farm.apsScore },
    })),
  }), [farmsWithBoundary]);

  const parcelStyle = useMemo(
    () => (feature?: { properties?: { apsScore?: number } }) => ({
      fillColor: getParcelColor(feature?.properties?.apsScore ?? 0),
      fillOpacity: 0.5,
      color: '#fff',
      weight: 1.5,
    }),
    []
  );

  const handleEachParcelFeature = useMemo(
    () => (feature: GeoJSON.Feature, layer: L.Layer) => {
      const id = feature.properties?.id as string | undefined;
      if (!id) return;
      layer.on('click', () => {
        const farm = farmById.get(id);
        if (farm) setSelectedFarm(farm);
      });
    },
    [farmById]
  );

  const selectedCoop = selectedFarm ? coopById.get(selectedFarm.cooperativeId) : null;

  return (
    <div className="relative h-full w-full min-h-[300px]" style={{ height: '100%', minHeight: '300px' }}>
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', background: '#f1f5f9' }}
      >
        <TileLayer url={OSM_URL} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />

        {/* Farm parcels as GeoJSON polygons */}
        <GeoJSON
          key="parcels"
          data={parcelsFeatureCollection}
          style={parcelStyle}
          onEachFeature={handleEachParcelFeature}
        />

        {/* NDVI overlay as rectangles */}
        {ndviLayerVisible &&
          ndviGrid.map((cell) => (
            <Rectangle
              key={cell.id}
              bounds={cell.bounds as LatLngBoundsExpression}
              pathOptions={{
                fillColor: getNdviColor(cell.ndvi),
                fillOpacity: 0.35,
                color: getNdviColor(cell.ndvi),
                weight: 0.5,
              }}
            />
          ))}

        {/* Layer toggle */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setNdviLayerVisible((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium shadow-md transition-colors ${
              ndviLayerVisible
                ? 'border-[#1A7A6E] bg-[#1A7A6E] text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {ndviLayerVisible ? 'Hide NDVI' : 'Show NDVI'}
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">APS Score</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#16a34a' }} />
              <span className="text-sm text-gray-700">Good (≥70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-sm text-gray-700">Moderate (40–69)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-sm text-gray-700">At risk (&lt;40)</span>
            </div>
          </div>
        </div>
      </MapContainer>

      {/* Sidebar */}
      {selectedFarm && (
        <aside className="absolute right-0 top-0 z-[1000] h-full w-80 border-l border-gray-200 bg-white shadow-xl">
          <div className="flex h-full flex-col p-5">
            <button
              type="button"
              onClick={() => setSelectedFarm(null)}
              className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="pr-8 text-lg font-semibold text-gray-900">Farm details</h3>
            <dl className="mt-4 flex flex-1 flex-col gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Farm ID</dt>
                <dd className="mt-0.5 font-mono text-sm text-gray-900">{selectedFarm.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Farmer</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{selectedFarm.farmerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Cooperative</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{selectedCoop?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">APS Score</dt>
                <dd
                  className="mt-1 text-3xl font-bold"
                  style={{ color: getScoreColor(selectedFarm.apsScore) }}
                >
                  {selectedFarm.apsScore}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Certificate status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      selectedFarm.status === 'certified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedFarm.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {formatStatus(selectedFarm.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Last updated</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {formatDate(selectedFarm.certificateDate)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      )}
    </div>
  );
}
