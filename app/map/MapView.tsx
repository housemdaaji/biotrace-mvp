'use client';

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Rectangle, Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';
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

const deforestationFlagIcon = divIcon({
  className: 'deforestation-flag',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#dc2626;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);">🌲⚠️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

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
  const [legendCollapsed, setLegendCollapsed] = useState(false);

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

  const parcelsFeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: farmsWithBoundary.map((farm) => ({
        type: 'Feature' as const,
        geometry: farm.boundary,
        properties: {
          id: farm.id,
          apsScore: farm.apsScore,
          deforestationRisk: farm.deforestationRisk,
        },
      })),
    }),
    [farmsWithBoundary]
  );

  const parcelStyle = useMemo(
    () => (feature?: { properties?: { apsScore?: number; deforestationRisk?: boolean } }) => {
      const risk = feature?.properties?.deforestationRisk ?? false;
      const base = {
        fillColor: getParcelColor(feature?.properties?.apsScore ?? 0),
        fillOpacity: 0.5,
        color: risk ? '#dc2626' : '#fff',
        weight: risk ? 3 : 1.5,
        ...(risk ? { dashArray: '6 3', className: 'deforestation-risk-parcel' } : {}),
      };
      return base;
    },
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

  const farmsWithDeforestationRisk = useMemo(
    () => farmsWithBoundary.filter((f) => f.deforestationRisk),
    [farmsWithBoundary]
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

        {/* Deforestation risk markers */}
        {farmsWithDeforestationRisk.map((farm) => (
          <Marker
            key={farm.id}
            position={[farm.lat, farm.lng]}
            icon={deforestationFlagIcon}
            eventHandlers={{
              click: () => setSelectedFarm(farm),
            }}
          />
        ))}

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

        {/* Full legend panel */}
        <div
          className="absolute bottom-6 left-4 z-[1000] max-w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-md"
          style={{ padding: '12px' }}
        >
          <button
            type="button"
            onClick={() => setLegendCollapsed((c) => !c)}
            className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wide text-gray-500"
          >
            Legend
            <span
              className="inline-block text-gray-400 transition-transform"
              style={{ transform: legendCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
              aria-hidden
            >
              ▼
            </span>
          </button>
          {!legendCollapsed && (
            <div className="mt-2 space-y-3">
              {/* Section 1 — APS Score */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">APS Score (Farm Parcels)</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#16a34a' }} />
                    <span className="text-sm text-gray-700">Good (≥70)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
                    <span className="text-sm text-gray-700">Moderate (40–69)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                    <span className="text-sm text-gray-700">At Risk (&lt;40)</span>
                  </div>
                </div>
              </div>
              {/* Section 2 — NDVI (only when visible) */}
              {ndviLayerVisible && (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">NDVI Vegetation Health</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#15803d' }} />
                      <span className="text-sm text-gray-700">High (&gt;0.6)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#86efac' }} />
                      <span className="text-sm text-gray-700">Moderate (0.4–0.6)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#fde047' }} />
                      <span className="text-sm text-gray-700">Low (0.2–0.4)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                      <span className="text-sm text-gray-700">Very Low (&lt;0.2)</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Section 3 — Indicators */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">Indicators</p>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm border-2 border-red-600"
                    style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}
                  />
                  <span className="text-sm text-gray-700">⚠️ Red dashed border = Deforestation Risk</span>
                </div>
              </div>
            </div>
          )}
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

            {selectedFarm.deforestationRisk && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                ⚠️ Deforestation Risk Detected — Canopy loss &gt;20% YoY
              </div>
            )}

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
