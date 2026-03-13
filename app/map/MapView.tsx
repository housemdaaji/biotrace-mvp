'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Rectangle, Marker, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { Farm, Cooperative } from './types';
import { computeAGB, computeCarbonProxy, agbRating, carbonRating } from '@/lib/biomass';
import type { SentinelResult } from '@/components/SentinelPanel';
import MagoScoreCard, { type MetricItem } from '@/components/MagoScoreCard';
import {
  MetricIcon,
  CheckIcon,
  AlertIcon,
  XIcon,
  ClipboardIcon,
  LeafIcon,
  MapIcon,
  SatelliteIcon,
  RefreshIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon,
} from '@/components/Icons';
import type { MetricIconKey } from '@/components/Icons';

import 'leaflet-draw/dist/leaflet.draw.css';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ESRI_IMAGERY_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const CENTER: [number, number] = [-0.35, 37.45];
const ZOOM = 9;

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

function formatStatus(status?: string): string {
  if (status === 'certified') return 'Certified';
  if (status === 'pending') return 'Pending';
  if (status === 'at-risk') return 'At-Risk';
  return status || '—';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

type ComplianceStatus = 'green' | 'yellow' | 'red';

function getDeforestationStatus(apsScore: number): ComplianceStatus {
  if (apsScore >= 60) return 'green';
  if (apsScore >= 40) return 'yellow';
  return 'red';
}

function getApsStatus(apsScore: number): ComplianceStatus {
  if (apsScore >= 70) return 'green';
  if (apsScore >= 40) return 'yellow';
  return 'red';
}

function getBiodiversityStatus(biodiversity: number): ComplianceStatus {
  if (biodiversity >= 65) return 'green';
  if (biodiversity >= 40) return 'yellow';
  return 'red';
}

function getCarbonFootprintStatus(carbon: number): ComplianceStatus {
  if (carbon <= 40) return 'green';
  if (carbon <= 65) return 'yellow';
  return 'red';
}

function getWaterFootprintStatus(water: number): ComplianceStatus {
  if (water <= 35) return 'green';
  if (water <= 60) return 'yellow';
  return 'red';
}

function buildMetricsFromFarm(farm: Farm): MetricItem[] {
  const apsScore = farm.apsScore;
  const biodiversity = Math.min(100, apsScore + 8);
  const carbon = Math.max(0, Math.round(100 - apsScore + 12));
  const water = Math.max(0, Math.round(100 - apsScore + 5));
  return [
    { iconKey: 'deforestation', name: 'Deforestation-Free Compliance', score: apsScore, unit: '/100', certified: getDeforestationStatus(apsScore) === 'green' },
    { iconKey: 'agroecology', name: 'Agroecology Practice Score', score: apsScore, unit: '/100', certified: getApsStatus(apsScore) === 'green' },
    { iconKey: 'biodiversity', name: 'Biodiversity Score', score: biodiversity, unit: '/100', certified: getBiodiversityStatus(biodiversity) === 'green' },
    { iconKey: 'carbon', name: 'Carbon Footprint', score: carbon, unit: 'tCO₂/ha', certified: getCarbonFootprintStatus(carbon) === 'green' },
    { iconKey: 'water', name: 'Water Footprint', score: water, unit: 'm³/ha', certified: getWaterFootprintStatus(water) === 'green' },
  ];
}

const deforestationFlagIcon = divIcon({
  className: 'deforestation-flag',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#dc2626;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);">!</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function getCooperativeLabelIcon(name: string, crop: string) {
  let initial = 'G';
  if (crop.toLowerCase().includes('coffee')) initial = 'C';
  else if (crop.toLowerCase().includes('tea')) initial = 'T';
  else if (crop.toLowerCase().includes('cocoa')) initial = 'K';
  else if (crop.toLowerCase().includes('olive')) initial = 'O';
  return divIcon({
    className: '',
    html: `<div style="background:#0D3D35;color:#0DF5B4;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap;border:1px solid #1A7A6E;box-shadow:0 2px 4px rgba(0,0,0,0.2);transform:translate(-50%,-50%);">${initial} ${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function getCertifiedFarmIcon() {
  return divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#1A7A6E;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);">✓</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/** GeoJSON Polygon coordinates[0] is exterior ring; each point is [lng, lat]. Returns [lat, lng] for Leaflet. */
function getParcelCenter(boundary?: Farm['boundary']): [number, number] {
  if (!boundary) return [0, 0];
  const ring = boundary.coordinates[0];
  if (!ring?.length) return [0, 0];
  let sumLng = 0;
  let sumLat = 0;
  for (const p of ring) {
    sumLng += p[0];
    sumLat += p[1];
  }
  return [sumLat / ring.length, sumLng / ring.length];
}

export interface NdviCell {
  id: string;
  lat: number;
  lng: number;
  ndvi: number;
  bounds: [[number, number], [number, number]];
}

export interface NdviTemporalData {
  months: string[];
  snapshots: Record<string, NdviCell[]>;
}

interface MapViewProps {
  farms: Farm[];
  cooperatives: Cooperative[];
  ndviTemporalData: NdviTemporalData;
  onDrawMode?: (active: boolean) => void;
  isDrawing?: boolean;
  onBBoxDrawn?: (bbox: [number, number, number, number]) => void;
  sentinelResult?: SentinelResult | null;
  onFarmSelected?: (hasFarm: boolean) => void;
}

const MONTH_COUNT = 6;
const LAST_MONTH_INDEX = MONTH_COUNT - 1;

function MapDrawAndOverlay({
  isDrawing,
  onBBoxDrawn,
  sentinelResult,
}: {
  isDrawing?: boolean;
  onBBoxDrawn?: (bbox: [number, number, number, number]) => void;
  sentinelResult?: SentinelResult | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const L = require('leaflet');
    require('leaflet-draw');
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const handleDrawCreated = (e: { layer: L.Layer & { getBounds: () => L.LatLngBounds } }) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      const b = e.layer.getBounds();
      const bbox: [number, number, number, number] = [
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth(),
      ];
      onBBoxDrawn?.(bbox);
    };
    map.on((L as unknown as { Draw: { Event: { CREATED: string } } }).Draw.Event.CREATED, handleDrawCreated);
    return () => {
      map.off((L as unknown as { Draw: { Event: { CREATED: string } } }).Draw.Event.CREATED, handleDrawCreated);
      map.removeLayer(drawnItems);
      drawnItems.clearLayers();
    };
  }, [map, onBBoxDrawn]);

  useEffect(() => {
    if (typeof window === 'undefined' || !map) return;
    if (!isDrawing) return;
    const L = require('leaflet');
    require('leaflet-draw');
    const drawHandler = new (L as unknown as { Draw: { Rectangle: new (map: L.Map, options: object) => { enable: () => void; disable: () => void } } }).Draw.Rectangle(
      map,
      {
        shapeOptions: {
          color: '#1A7A6E',
          weight: 2,
          fillOpacity: 0.1,
        },
      }
    );
    drawHandler.enable();
    return () => {
      try {
        drawHandler.disable();
      } catch {
        // ignore
      }
    };
  }, [map, isDrawing]);

  useEffect(() => {
    if (typeof window === 'undefined' || !map) return;
    map.eachLayer((layer: L.Layer & { _isSentinelOverlay?: boolean }) => {
      if (layer._isSentinelOverlay) {
        map.removeLayer(layer);
      }
    });
    if (sentinelResult) {
      const L = require('leaflet');
      const bounds: L.LatLngBoundsExpression = [
        [sentinelResult.bbox[1], sentinelResult.bbox[0]],
        [sentinelResult.bbox[3], sentinelResult.bbox[2]],
      ];
      const overlay = L.imageOverlay(sentinelResult.image, bounds, {
        opacity: 0.85,
      }) as L.ImageOverlay & { _isSentinelOverlay?: boolean };
      overlay._isSentinelOverlay = true;
      overlay.addTo(map);
      map.fitBounds(bounds);
    }
  }, [map, sentinelResult]);

  return null;
}

export default function MapView({
  farms,
  cooperatives,
  ndviTemporalData,
  isDrawing,
  onBBoxDrawn,
  sentinelResult,
  onFarmSelected,
}: MapViewProps) {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [basemap, setBasemap] = useState<'street' | 'satellite'>('street');
  const [ndviLayerVisible, setNdviLayerVisible] = useState(true);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [monthIndex, setMonthIndex] = useState(LAST_MONTH_INDEX);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ndviOpacity, setNdviOpacity] = useState(0.35);
  const [sensorType, setSensorType] = useState<'optical' | 'radar'>('optical');
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const months = ndviTemporalData.months;
  const activeSnapshot = useMemo(
    () => (months[monthIndex] ? ndviTemporalData.snapshots[months[monthIndex]] ?? [] : []),
    [ndviTemporalData.snapshots, months, monthIndex]
  );

  useEffect(() => {
    if (!isPlaying) return;
    playIntervalRef.current = setInterval(() => {
      setMonthIndex((prev) => {
        if (prev >= LAST_MONTH_INDEX) {
          setIsPlaying(false);
          return LAST_MONTH_INDEX;
        }
        return prev + 1;
      });
    }, 1200);
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

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

  const certifiedFarms = useMemo(
    () => farmsWithBoundary.filter((f) => f.apsScore >= 70),
    [farmsWithBoundary]
  );

  const selectedCoop = selectedFarm ? coopById.get(selectedFarm.cooperativeId) : null;
  const ndviForFarm = selectedFarm ? (selectedFarm.ndvi ?? 0.5) : 0;
  const agb = selectedFarm ? computeAGB(ndviForFarm) : 0;
  const carbon = selectedFarm ? computeCarbonProxy(agb) : 0;
  const agbInfo = agbRating(agb);
  const carbonInfo = carbonRating(carbon);

  const farmMarkers = useMemo(() => {
    return farms.map((farm) => {
      const isCertified = farm.apsScore >= 60;
      return (
        <CircleMarker
          key={farm.id}
          center={[farm.lat, farm.lng]}
          radius={isCertified ? 10 : 8}
          pathOptions={{
            fillColor: farm.apsScore >= 70 ? '#1A7A6E' : farm.apsScore >= 50 ? '#F59E0B' : '#EF4444',
            fillOpacity: 0.85,
            color: isCertified ? '#0DF5B4' : '#ffffff',
            weight: isCertified ? 2.5 : 1.5,
          }}
          eventHandlers={{
            click: () => setSelectedFarm(farm as any),
          }}
        >
          <Tooltip permanent={false} direction="top">
            {farm.name} — APS {farm.apsScore}
          </Tooltip>
        </CircleMarker>
      );
    });
  }, [farms, setSelectedFarm]);

  const coopLabels = useMemo(() => {
    return cooperatives.map((coop) => {
      const coopFarms = farms.filter((f) => f.cooperativeId === coop.id);
      if (coopFarms.length === 0) return null;
      const sumLat = coopFarms.reduce((s, f) => s + f.lat, 0);
      const sumLng = coopFarms.reduce((s, f) => s + f.lng, 0);
      const centroid: [number, number] = [sumLat / coopFarms.length, sumLng / coopFarms.length];
      return (
        <Marker
          key={`coop-${coop.id}`}
          position={centroid}
          icon={getCooperativeLabelIcon(coop.name, coop.crop)}
          interactive={false}
          zIndexOffset={-100}
        />
      );
    });
  }, [cooperatives, farms]);

  useEffect(() => {
    if (onFarmSelected) {
      onFarmSelected(!!selectedFarm);
    }
  }, [selectedFarm, onFarmSelected]);

  return (
    <div className="flex flex-row h-full w-full min-h-[300px]" style={{ height: '100%', minHeight: '300px' }}>
      {/* LEFT SIDEBAR: Farm Details + MagoScoreCard */}
      <aside className="relative w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col max-h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {selectedFarm ? (
            <>
              <div className="sticky top-0 z-10 -mt-5 pt-5 -mx-5 px-5 pb-2 bg-white flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Farm details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedFarm(null)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedFarm.deforestationRisk && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <span className="inline-flex items-center gap-1"><AlertIcon className="w-4 h-4" /> Deforestation Risk Detected — Canopy loss &gt;20% YoY</span>
                </div>
              )}
              <dl className="mt-4 flex flex-col gap-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Farm ID</dt>
                  <dd className="mt-0.5 font-mono text-sm text-gray-900">{selectedFarm.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Farmer</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">{selectedFarm.farmer}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Cooperative</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">{selectedCoop?.name ?? '—'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Crop</dt>
                    <dd className="mt-0.5 text-sm text-gray-900">{selectedFarm.crop}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Farm Size</dt>
                    <dd className="mt-0.5 text-sm text-gray-900">{selectedFarm.farmSize} ha</dd>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Country</dt>
                    <dd className="mt-0.5 text-sm text-gray-900">{selectedFarm.country}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Practices Since</dt>
                    <dd className="mt-0.5 text-sm text-gray-900">{selectedFarm.practicesSince}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Updated</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">{formatDate(selectedFarm.lastUpdated)}</dd>
                </div>
              </dl>
              {/* Compliance summary, Biomass & Carbon, Certificate — kept in Farm Details */}
              {selectedFarm && (() => {
                const apsScore = selectedFarm.apsScore;
                const biodiversity = Math.min(100, apsScore + 8);
                const carbon = Math.max(0, Math.round(100 - apsScore + 12));
                const water = Math.max(0, Math.round(100 - apsScore + 5));
                const deforestStatus = getDeforestationStatus(apsScore);
                const apsStatus = getApsStatus(apsScore);
                const bioStatus = getBiodiversityStatus(biodiversity);
                const carbonStatus = getCarbonFootprintStatus(carbon);
                const waterStatus = getWaterFootprintStatus(water);
                const statuses = [deforestStatus, apsStatus, bioStatus, carbonStatus, waterStatus];
                const hasRed = statuses.some((s) => s === 'red');
                const allGreen = statuses.every((s) => s === 'green');
                const eudrSummary =
                  allGreen
                    ? { type: 'compliant' as const, title: 'EUDR Compliant', desc: 'Deforestation-free verified · Ready for EU market', Icon: CheckIcon }
                    : hasRed
                      ? { type: 'risk' as const, title: 'EUDR Risk Detected', desc: 'Action required before certification', Icon: AlertIcon }
                      : { type: 'pending' as const, title: 'EUDR Pending', desc: 'Improvements needed · Re-assess in 90 days', Icon: RefreshIcon };
                const rows: Array<{ iconKey: MetricIconKey; label: string; value?: string; status: ComplianceStatus }> = [
                  { iconKey: 'deforestation', label: 'Deforestation-Free Status', status: deforestStatus },
                  { iconKey: 'agroecology', label: 'Agroecology Practice Score', value: `${apsScore}/100`, status: apsStatus },
                  { iconKey: 'biodiversity', label: 'Biodiversity Score', value: `${biodiversity}/100`, status: bioStatus },
                  { iconKey: 'carbon', label: 'Carbon Footprint', value: `${carbon} tCO₂/ha`, status: carbonStatus },
                  { iconKey: 'water', label: 'Water Footprint', value: `${water} m³/ha`, status: waterStatus },
                ];
                return (
                  <>
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <ClipboardIcon className="w-4 h-4 text-[#2D5A2E]" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Compliance indicators</span>
                      </div>
                      <div className={`mb-3 rounded-lg border px-3 py-2 text-center ${eudrSummary.type === 'compliant' ? 'border-green-200 bg-green-50' : eudrSummary.type === 'risk' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                        <p className={`text-xs font-bold inline-flex items-center justify-center gap-1 ${eudrSummary.type === 'compliant' ? 'text-green-700' : eudrSummary.type === 'risk' ? 'text-red-700' : 'text-amber-700'}`}>
                          {(() => { const EudrIcon = eudrSummary.Icon; return <><EudrIcon className="w-3.5 h-3.5" /> {eudrSummary.title}</>; })()}
                        </p>
                        <p className={`text-[10px] ${eudrSummary.type === 'compliant' ? 'text-green-600' : eudrSummary.type === 'risk' ? 'text-red-600' : 'text-amber-600'}`}>{eudrSummary.desc}</p>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-white">
                        {rows.map((row) => (
                          <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[#2D5A2E]"><MetricIcon iconKey={row.iconKey} className="w-4 h-4" /></span>
                              <div>
                                <p className="text-xs font-semibold text-gray-700">{row.label}</p>
                                {row.value != null && <p className="text-[10px] text-gray-400">{row.value}</p>}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${row.status === 'green' ? 'bg-green-100 text-green-700' : row.status === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                              {row.status === 'green' ? <><CheckIcon className="w-3 h-3" /> Compliant</> : row.status === 'yellow' ? <><AlertIcon className="w-3 h-3" /> Needs Attention</> : <><XIcon className="w-3 h-3" /> Non-Compliant</>}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => typeof window !== 'undefined' && window.open('/eudr', '_blank')} className="mt-3 w-full rounded-lg bg-[#1A7A6E] py-2 text-sm font-medium text-white hover:bg-[#15635A] inline-flex items-center justify-center gap-2"><ClipboardIcon className="w-4 h-4" /> View Full EUDR Report</button>
                    </div>
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <LeafIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Biomass & Carbon</span>
                        <span className="ml-auto rounded-full bg-[#1A7A6E]/10 px-2 py-0.5 text-xs text-[#1A7A6E]">Sentinel-2 proxy</span>
                      </div>
                      <div className="mb-2 rounded-lg p-3" style={{ backgroundColor: agbInfo.bg }}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-gray-600">Above-Ground Biomass</span>
                          <span className="text-lg font-bold" style={{ color: agbInfo.color }}>{agb} <span className="text-xs font-normal">t/ha</span></span>
                        </div>
                        <div className="mt-1 text-xs font-medium" style={{ color: agbInfo.color }}>{agbInfo.label}</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/60">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (agb / 35) * 100)}%`, backgroundColor: agbInfo.color }} />
                        </div>
                        <div className="mt-0.5 flex justify-between text-xs text-gray-400"><span>0</span><span>35 t/ha max</span></div>
                      </div>
                      <div className="rounded-lg border border-gray-100 bg-white p-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-gray-600">Carbon Sequestration Proxy</span>
                          <span className="text-lg font-bold" style={{ color: carbonInfo.color }}>~{carbon}<span className="text-xs font-normal"> tCO₂e/ha</span></span>
                        </div>
                        <div className="mt-1 text-xs font-medium" style={{ color: carbonInfo.color }}>{carbonInfo.label}</div>
                      </div>
                      <details className="mt-3">
                        <summary className="cursor-pointer select-none text-xs text-gray-400 hover:text-gray-600">▸ How is this calculated?</summary>
                        <div className="mt-2 space-y-1 rounded-lg border border-gray-100 bg-white p-3 text-xs text-gray-500">
                          <p><span className="font-mono text-[#1A7A6E]">AGB = NDVI × 50</span><span className="ml-1">(proxy model, t/ha)</span></p>
                          <p><span className="font-mono text-[#1A7A6E]">tCO₂e = AGB × 0.47 × 3.67</span></p>
                          <p className="italic text-gray-400">IPCC carbon fraction (0.47) × CO₂/C ratio (3.67). Proxy only — not validated for carbon credit issuance. Phase 2 integrates CGIAR-reviewed allometric models.</p>
                        </div>
                      </details>
                    </div>
                    <div className="mt-4">
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Certificate status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedFarm.status === 'certified' ? 'bg-emerald-100 text-emerald-800' : selectedFarm.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{formatStatus(selectedFarm.status)}</span>
                      </dd>
                    </div>
                    <div className="mt-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Last updated</dt>
                      <dd className="mt-0.5 text-sm text-gray-900">{formatDate(selectedFarm.certificateDate)}</dd>
                    </div>
                  </>
                );
              })()}
              <div className="border-t border-gray-200 my-4" />
              <MagoScoreCard
                farmName={selectedFarm.farmer}
                overallScore={selectedFarm.apsScore}
                metrics={buildMetricsFromFarm(selectedFarm)}
                onGenerateReport={() => typeof window !== 'undefined' && window.open('/eudr', '_blank')}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2D5A2E" strokeWidth="1.5" className="w-8 h-8">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Select a farm parcel</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Click any parcel on the map to view its farm details, APS score, and certification status.
              </p>
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">Cooperatives</span>
                  <span className="text-xs font-bold text-[#2D5A2E]">{cooperatives.length}</span>
                </div>
                <div className="flex justify-between items-center bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">Farm parcels</span>
                  <span className="text-xs font-bold text-[#2D5A2E]">{farms.length}</span>
                </div>
                <div className="flex justify-between items-center bg-amber-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">Certified farms</span>
                  <span className="text-xs font-bold text-[#BC9420]">
                    {farms.filter((f) => f.apsScore >= 50).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* CENTER: Map */}
      <div className="flex-1 relative min-w-0" style={{ minHeight: '300px' }}>
      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', background: '#f1f5f9' }}
      >
        <TileLayer
          key={basemap}
          url={basemap === 'street' ? OSM_URL : ESRI_IMAGERY_URL}
          attribution={
            basemap === 'street'
              ? '© OpenStreetMap contributors'
              : '© Esri, Maxar, Earthstar Geographics'
          }
        />

        {/* Basemap toggle */}
        <div className="absolute z-[1000] flex gap-1" style={{ top: '10px', left: '10px' }}>
          <button
            type="button"
            onClick={() => setBasemap('street')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-md transition-colors inline-flex items-center ${
              basemap === 'street'
                ? 'border-[#1A7A6E] bg-[#1A7A6E] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 inline-block align-middle mr-1" /> Street
          </button>
          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-md transition-colors inline-flex items-center ${
              basemap === 'satellite'
                ? 'border-[#1A7A6E] bg-[#1A7A6E] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SatelliteIcon className="w-3.5 h-3.5 inline-block align-middle mr-1" /> Satellite
          </button>
        </div>

        {/* Farm parcels as CircleMarkers */}
        {farmMarkers}

        {/* Cooperative Cluster Labels */}
        {coopLabels}

        {/* NDVI / Radar overlay as rectangles (active month snapshot) */}
        {ndviLayerVisible &&
          activeSnapshot.map((cell) => {
            const color = sensorType === 'optical' ? getNdviColor(cell.ndvi) : `rgb(${Math.floor(cell.ndvi * 255)}, ${Math.floor(cell.ndvi * 255)}, ${Math.floor(cell.ndvi * 255)})`;
            return (
              <Rectangle
                key={`${monthIndex}-${cell.id}`}
                bounds={cell.bounds as LatLngBoundsExpression}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: ndviOpacity,
                  color: color,
                  weight: 0.5,
                }}
              />
            );
          })}

        {/* Sentinel-2 draw layer and image overlay */}
        <MapDrawAndOverlay
          isDrawing={isDrawing}
          onBBoxDrawn={onBBoxDrawn}
          sentinelResult={sentinelResult}
        />

        {/* Full legend panel */}
        <div
          className="absolute z-[999] max-w-[180px] rounded-lg border border-gray-200 bg-white p-3 shadow-md"
          style={{ padding: '12px', bottom: '20px', left: '10px' }}
        >
          <button
            type="button"
            onClick={() => setLegendCollapsed((c) => !c)}
            className="flex w-full items-center justify-between text-left text-xs font-bold uppercase tracking-wide text-gray-500"
          >
            Legend
            <span className="inline-block text-gray-400 transition-transform" style={{ transform: legendCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
              <ChevronDownIcon className="w-4 h-4" />
            </span>
          </button>
          {!legendCollapsed && (
            <div className="mt-2 space-y-3">
              {/* Section 1 — APS Score */}
              <div>
                <p className="mb-0.5 text-[10px] text-gray-400">Farm sustainability score out of 100</p>
                <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">APS Score (Farm Parcels)</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#16a34a' }} />
                    <span className="text-sm text-gray-700">Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
                    <span className="text-sm text-gray-700">Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                    <span className="text-sm text-gray-700">At Risk</span>
                  </div>
                </div>
              </div>
              {/* Section 2 — NDVI/Radar (only when visible) */}
              {ndviLayerVisible && sensorType === 'optical' && (
                <div>
                  <p className="mb-0.5 text-[10px] text-gray-400">How green and healthy the crops are</p>
                  <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">NDVI Vegetation Health</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#15803d' }} />
                      <span className="text-sm text-gray-700">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#86efac' }} />
                      <span className="text-sm text-gray-700">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#fde047' }} />
                      <span className="text-sm text-gray-700">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
                      <span className="text-sm text-gray-700">Very Low</span>
                    </div>
                  </div>
                </div>
              )}
              {ndviLayerVisible && sensorType === 'radar' && (
                <div>
                  <p className="mb-0.5 text-[10px] text-gray-400">Synthetic Aperture Radar backscatter</p>
                  <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">SAR Backscatter (Mock)</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm border border-gray-400" style={{ backgroundColor: 'rgb(200,200,200)' }} />
                      <span className="text-sm text-gray-700">High Return (Vegetated)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-sm border border-gray-400" style={{ backgroundColor: 'rgb(120,120,120)' }} />
                      <span className="text-sm text-gray-700">Low Return (Bare/Smooth)</span>
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
                  <span className="text-sm text-gray-700 inline-flex items-center gap-1"><AlertIcon className="w-3.5 h-3.5" /> Red dashed border = Deforestation Risk</span>
                </div>
              </div>
              {/* Section 4 — Biomass Scale */}
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="mb-0.5 text-[10px] text-gray-400">Estimated plant matter per hectare</p>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Biomass (AGB)
                </p>
                {[
                  { color: '#16a34a', label: '≥25 t/ha — High' },
                  { color: '#d97706', label: '15–24 t/ha — Moderate' },
                  { color: '#dc2626', label: '<15 t/ha — Low' },
                ].map(({ color, label }) => (
                  <div key={label} className="mb-1 flex items-center gap-2">
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
              {/* Section 5 — Certification Border */}
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Farm Status</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full border-[2.5px] border-[#0DF5B4]" style={{ backgroundColor: 'transparent' }} />
                    <span className="text-xs text-gray-600">Certified farm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full border-[1.5px] border-white bg-gray-200" />
                    <span className="text-xs text-gray-600">Not yet certified</span>
                  </div>
                </div>
                <p className="mt-2 text-xs italic text-gray-400">Click any parcel to view full details</p>
              </div>
            </div>
          )}
        </div>
      </MapContainer>
      </div>

      {/* RIGHT PANEL: Sentinel / Layer controls */}
      <aside className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
        <div className="p-4 flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Layer Controls</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Analysis Layer</span>
            <button
              type="button"
              onClick={() => setNdviLayerVisible((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                ndviLayerVisible ? 'bg-[#1A7A6E]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  ndviLayerVisible ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {ndviLayerVisible && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Opacity</span>
                  <span>{Math.round(ndviOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ndviOpacity}
                  onChange={(e) => setNdviOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[#1A7A6E]"
                />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
                  <span>Sensor Type</span>
                  <div className="group relative flex cursor-help items-center justify-center rounded-full bg-gray-100 h-4 w-4 text-[10px] text-gray-500">
                    ?
                    <div className="pointer-events-none absolute bottom-full right-0 mb-1 hidden w-48 rounded bg-gray-800 p-2 text-[10px] leading-relaxed text-white shadow-lg group-hover:block">
                      Radar (Sentinel-1 SAR) penetrates cloud cover, ensuring continuous monitoring regardless of weather.
                    </div>
                  </div>
                </div>
                <div className="flex overflow-hidden rounded-md border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSensorType('optical')}
                    className={`flex-1 py-1.5 text-xs transition-colors ${
                      sensorType === 'optical'
                        ? 'bg-[#1A7A6E] text-white font-medium'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Optical
                  </button>
                  <button
                    type="button"
                    onClick={() => setSensorType('radar')}
                    className={`flex-1 py-1.5 text-xs transition-colors ${
                      sensorType === 'radar'
                        ? 'bg-[#1A7A6E] text-white font-medium'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Radar (SAR)
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Satellite Timeline</p>
            <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-[#1A7A6E] block">{months[monthIndex] ?? ''}</span>
                <input
                  type="range"
                  min={0}
                  max={LAST_MONTH_INDEX}
                  step={1}
                  value={monthIndex}
                  onChange={(e) => setMonthIndex(Number(e.target.value))}
                  className="mt-2 w-full accent-[#1A7A6E]"
                />
                <div className="mt-1.5 flex flex-wrap gap-1 text-xs">
                  {months.map((month, i) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => setMonthIndex(i)}
                      className={`shrink-0 truncate px-1 ${i === monthIndex ? 'font-medium text-[#1A7A6E]' : 'text-gray-500 hover:text-gray-700'}`}
                      title={month}
                    >
                      {month.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
