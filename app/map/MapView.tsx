'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import type { Farm, Cooperative } from './types';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const CENTER: [number, number] = [0.05, 37.65];
const ZOOM = 11;

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

interface MapViewProps {
  farms: Farm[];
  cooperatives: Cooperative[];
}

export default function MapView({ farms, cooperatives }: MapViewProps) {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  const coopById = useMemo(() => {
    const m = new Map<string, Cooperative>();
    cooperatives.forEach((c) => m.set(c.id, c));
    return m;
  }, [cooperatives]);

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
        {farms.map((farm) => (
          <CircleMarker
            key={farm.id}
            center={[farm.lat, farm.lng]}
            radius={10}
            pathOptions={{
              fillColor: getScoreColor(farm.apsScore),
              color: '#fff',
              weight: 2,
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => setSelectedFarm(farm),
            }}
          />
        ))}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">APS Score</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#1A7A6E' }} />
              <span className="text-sm text-gray-700">Good (≥70)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
              <span className="text-sm text-gray-700">Moderate (40–69)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
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
