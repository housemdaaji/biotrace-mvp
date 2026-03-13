'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Rectangle, Marker, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { Farm, Cooperative } from './types';
import { computeAGB, computeCarbonProxy, agbRating, carbonRating } from '@/lib/biomass';
import type { SentinelResult } from '@/components/SentinelPanel';
import {
  MetricIcon,
  CheckIcon,
  AlertIcon,
  XIcon,
  ClipboardIcon,
  DocumentIcon,
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

const INDICES = [
  { id: 'NDVI', label: 'Vegetation Health' },
  { id: 'NDWI', label: 'Water Index' },
  { id: 'NDMI', label: 'Soil Moisture' },
  { id: 'BSI', label: 'Bare Soil' },
  { id: 'EVI', label: 'Enhanced Vegetation' },
  { id: 'NBR', label: 'Burn/Recovery' },
];

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

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function MapView({
  farms,
  cooperatives,
  ndviTemporalData,
  isDrawing,
  onDrawMode,
  onBBoxDrawn,
  sentinelResult,
  onFarmSelected,
}: MapViewProps) {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [basemap, setBasemap] = useState<'street' | 'satellite'>('street');
  const [ndviLayerVisible, setNdviLayerVisible] = useState(true);
  const [monthIndex, setMonthIndex] = useState(LAST_MONTH_INDEX);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ndviOpacity, setNdviOpacity] = useState(0.35);
  const [sensorType, setSensorType] = useState<'optical' | 'radar'>('optical');
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<any>(null);
  const [selectedIndex, setSelectedIndex] = useState('NDVI');
  const [dateFrom, setDateFrom] = useState('2024-10-01');
  const [dateTo, setDateTo] = useState('2025-03-01');
  const [inputMode, setInputMode] = useState<'draw' | 'coords'>('draw');

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

  const handleIndexChange = (id: string) => {
    setSelectedIndex(id);
  };

  const handleZoomToCooperative = (coopId: string) => {
    if (!mapRef.current) return;
    const coopFarms = farms.filter((f) => f.cooperativeId === coopId);
    if (!coopFarms.length) return;
    const lats = coopFarms.map((f) => f.lat);
    const lngs = coopFarms.map((f) => f.lng);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    mapRef.current.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      { padding: [40, 40] }
    );
  };

  const certifiedCount = useMemo(
    () => farms.filter((f) => f.apsScore >= 50).length,
    [farms]
  );

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
      {/* LEFT PANEL — sidebar with sliding panels */}
      <aside className="w-72 flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden relative flex-shrink-0">
        {/* Default panel (no farm selected) */}
        <div
          className={`absolute inset-0 transform transition-transform duration-300 ${
            selectedFarm ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <div className="h-full overflow-y-auto flex flex-col">
            <CollapsibleSection title="Legend">
              {/* APS Score */}
              <div className="mb-3">
                <p className="mb-0.5 text-[10px] text-gray-400">Farm sustainability score out of 100</p>
                <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">APS Score (Farm Parcels)</p>
                <div className="space-y-1">
                  <div>
                    <span className="w-3 h-3 rounded-full bg-green-600 inline-block mr-2" />
                    <span className="text-xs text-gray-600">Good</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block mr-2" />
                    <span className="text-xs text-gray-600">Moderate</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block mr-2" />
                    <span className="text-xs text-gray-600">At Risk</span>
                  </div>
                </div>
              </div>
              {/* NDVI Vegetation Health */}
              <div className="mb-3">
                <p className="mb-0.5 text-[10px] text-gray-400">How green and healthy the crops are</p>
                <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">NDVI Vegetation Health</p>
                <div className="space-y-1">
                  <div>
                    <span className="w-3 h-3 rounded-full bg-green-800 inline-block mr-2" />
                    <span className="text-xs text-gray-600">High</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-green-300 inline-block mr-2" />
                    <span className="text-xs text-gray-600">Moderate</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-yellow-300 inline-block mr-2" />
                    <span className="text-xs text-gray-600">Low</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block mr-2" />
                    <span className="text-xs text-gray-600">Very Low</span>
                  </div>
                </div>
              </div>
              {/* Indicators */}
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-bold uppercase text-gray-500">Indicators</p>
                <div>
                  <span className="w-6 border-t-2 border-dashed border-red-400 inline-block mr-2 align-middle" />
                  <span className="text-xs text-gray-600">Red dashed border = Deforestation Risk</span>
                </div>
              </div>
              {/* Biomass (AGB) */}
              <div className="mb-3">
                <p className="mb-0.5 text-[10px] text-gray-400">Estimated plant matter per hectare</p>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Biomass (AGB)
                </p>
                <div className="space-y-1">
                  <div>
                    <span className="w-3 h-3 rounded-full bg-green-600 inline-block mr-2" />
                    <span className="text-xs text-gray-600">≥25 t/ha — High</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-amber-600 inline-block mr-2" />
                    <span className="text-xs text-gray-600">15–24 t/ha — Moderate</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block mr-2" />
                    <span className="text-xs text-gray-600">&lt;15 t/ha — Low</span>
                  </div>
                </div>
              </div>
              {/* Farm Status */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Farm Status</p>
                <div className="space-y-1">
                  <div>
                    <span className="w-3 h-3 rounded-full border-[2.5px] border-[#0DF5B4] inline-block mr-2" />
                    <span className="text-xs text-gray-600">Certified farm</span>
                  </div>
                  <div>
                    <span className="w-3 h-3 rounded-full bg-gray-300 inline-block mr-2" />
                    <span className="text-xs text-gray-600">Not yet certified</span>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Overview">
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[90px] rounded-lg bg-green-50 px-3 py-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Cooperatives</p>
                  <p className="text-sm font-bold text-[#2D5A2E]">{cooperatives.length}</p>
                </div>
                <div className="flex-1 min-w-[90px] rounded-lg bg-green-50 px-3 py-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Farms</p>
                  <p className="text-sm font-bold text-[#2D5A2E]">{farms.length}</p>
                </div>
                <div className="w-full rounded-lg bg-amber-50 px-3 py-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Certified</p>
                  <p className="text-sm font-bold text-[#BC9420]">{certifiedCount}</p>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Cooperatives">
              <div className="space-y-2">
                {cooperatives.map((coop) => {
                  const coopFarms = farms.filter((f) => f.cooperativeId === coop.id);
                  const initial = (coop.crop || '').charAt(0).toUpperCase() || 'C';
                  return (
                    <button
                      key={coop.id}
                      type="button"
                      onClick={() => handleZoomToCooperative(coop.id)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:border-[#1A7A6E] hover:bg-[#f0faf9] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0D3D35] text-[11px] font-semibold text-[#0DF5B4]">
                            {initial}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{coop.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {coop.crop} · {coopFarms.length} farms
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Farm detail panel (when a farm is selected) */}
        <div
          className={`absolute inset-0 transform transition-transform duration-300 ${
            selectedFarm ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedFarm && (
            <div className="h-full overflow-y-auto flex flex-col">
              {/* Back + header */}
              <div className="px-4 pt-4 pb-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedFarm(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <span aria-hidden>←</span>
                  <span>Back</span>
                </button>
              </div>
              <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                    Farm Details
                  </p>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">
                    {selectedFarm.farmer ?? selectedFarm.name}
                  </h2>
                  {selectedCoop && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{selectedCoop.name}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFarm(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  aria-label="Close"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {/* APS badge */}
              <div className="px-4 py-3 bg-green-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Mago APS Score</span>
                  <span className="text-2xl font-bold text-[#2D5A2E]">
                    {selectedFarm.apsScore}
                    <span className="text-sm font-normal text-gray-400">/100</span>
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500" />
              </div>

              {/* Deforestation warning */}
              {selectedFarm.deforestationRisk && (
                <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  <span className="inline-flex items-center gap-1">
                    <AlertIcon className="w-4 h-4" /> Deforestation Risk Detected — Canopy loss &gt;20% YoY
                  </span>
                </div>
              )}

              {/* Details section */}
              <CollapsibleSection title="Details">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 shrink-0 w-24">Cooperative</span>
                    <span className="text-gray-800 font-medium text-right">{selectedCoop?.name ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 shrink-0 w-24">Country</span>
                    <span className="text-gray-800 font-medium text-right">{selectedFarm.country ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 shrink-0 w-24">Crop</span>
                    <span className="text-gray-800 font-medium text-right">{selectedFarm.crop ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 shrink-0 w-24">Area</span>
                    <span className="text-gray-800 font-medium text-right">
                      {selectedFarm.farmSize != null ? `${selectedFarm.farmSize} ha` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 shrink-0 w-24">Status</span>
                    <span className="text-gray-800 font-medium text-right">
                      {selectedFarm.apsScore >= 50 ? 'Certified' : 'Not Certified'}
                    </span>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Indicators section */}
              {(() => {
                const apsScore = selectedFarm.apsScore;
                const biodiversity = Math.min(100, apsScore + 8);
                const carbonVal = Math.max(0, Math.round(100 - apsScore + 12));
                const waterVal = Math.max(0, Math.round(100 - apsScore + 5));
                const deforestStatus = getDeforestationStatus(apsScore);
                const apsStatus = getApsStatus(apsScore);
                const bioStatus = getBiodiversityStatus(biodiversity);
                const carbonStatus = getCarbonFootprintStatus(carbonVal);
                const waterStatus = getWaterFootprintStatus(waterVal);
                const metricRows: Array<{ iconKey: MetricIconKey; label: string; value: string; status: ComplianceStatus }> =
                  [
                    { iconKey: 'deforestation', label: 'Deforestation-Free Status', value: `${apsScore}/100`, status: deforestStatus },
                    { iconKey: 'agroecology', label: 'Agroecology Practice Score', value: `${apsScore}/100`, status: apsStatus },
                    { iconKey: 'biodiversity', label: 'Biodiversity Score', value: `${biodiversity}/100`, status: bioStatus },
                    { iconKey: 'carbon', label: 'Carbon Footprint', value: `${carbonVal} tCO₂/ha`, status: carbonStatus },
                    { iconKey: 'water', label: 'Water Footprint', value: `${waterVal} m³/ha`, status: waterStatus },
                  ];
                const statusLabel = (s: ComplianceStatus) =>
                  s === 'green' ? 'Compliant' : s === 'yellow' ? 'Needs Attention' : 'Non-Compliant';
                const statusColor = (s: ComplianceStatus) =>
                  s === 'green'
                    ? 'bg-green-100 text-green-700'
                    : s === 'yellow'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-600';
                const improvementCount = metricRows.filter((m) => m.status !== 'green').length;

                return (
                  <>
                    <CollapsibleSection title="Indicators">
                      <div>
                        {metricRows.map((row) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <MetricIcon
                                iconKey={row.iconKey}
                                className="w-4 h-4 shrink-0 text-[#2D5A2E]"
                              />
                              <span className="text-xs text-gray-600">{row.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-800">{row.value}</span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(
                                  row.status
                                )}`}
                              >
                                {statusLabel(row.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>

                    {/* Certification section */}
                    <CollapsibleSection title="Certification">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 mr-2">Status</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              selectedFarm.apsScore >= 50
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {selectedFarm.apsScore >= 50 ? 'Certified' : 'Not Yet Certified'}
                          </span>
                        </div>
                        {selectedFarm.apsScore < 50 && improvementCount > 0 && (
                          <p className="text-xs text-amber-700">
                            {improvementCount} criteria need improvement before certification.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            typeof window !== 'undefined' && window.open('/eudr', '_blank')
                          }
                          className="mt-2 w-full bg-[#2D5A2E] text-white text-sm font-semibold py-3 rounded-lg hover:bg-[#4A8C35] transition-colors flex items-center justify-center gap-2"
                        >
                          <DocumentIcon className="w-4 h-4" />
                          Generate Certification Report
                        </button>
                      </div>
                    </CollapsibleSection>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </aside>

      {/* CENTER: Map */}
      <div className="flex-1 relative min-w-0" style={{ minHeight: '300px' }}>
        <MapContainer
          ref={mapRef}
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
              const color =
                sensorType === 'optical'
                  ? getNdviColor(cell.ndvi)
                  : `rgb(${Math.floor(cell.ndvi * 255)}, ${Math.floor(
                      cell.ndvi * 255
                    )}, ${Math.floor(cell.ndvi * 255)})`;
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
        </MapContainer>
      </div>

      {/* RIGHT PANEL: Unified Sentinel-2 Analysis panel */}
      <aside className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SatelliteIcon className="w-4 h-4 text-[#1A7A6E]" />
              <span className="text-sm font-semibold text-gray-700">Sentinel-2 Analysis</span>
            </div>
          </div>

          {/* Analysis Layer + Sensor Type */}
          <div className="border-t border-gray-100 pt-3">
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
              <div className="space-y-3 mt-3">
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
          </div>

          {/* Index + date + area selection controls */}
          <div className="border-t border-gray-100 my-2" />

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Index
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {INDICES.map((idx) => {
                const active = selectedIndex === idx.id;
                return (
                  <button
                    key={idx.id}
                    type="button"
                    onClick={() => handleIndexChange(idx.id)}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold text-left transition-all ${
                      active
                        ? 'border-[#1A7A6E] bg-[#1A7A6E] text-white'
                        : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-[#1A7A6E]'
                    }`}
                  >
                    <span className="block leading-tight">{idx.label}</span>
                    <span
                      className={`mt-0.5 block text-[8px] opacity-60 ${
                        active ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {idx.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-0.5 w-full rounded border border-gray-200 px-1.5 py-1 text-[10px] outline-none focus:border-[#1A7A6E]"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-0.5 w-full rounded border border-gray-200 px-1.5 py-1 text-[10px] outline-none focus:border-[#1A7A6E]"
              />
            </div>
          </div>

          <div className="flex overflow-hidden rounded-lg border border-gray-200 mt-3">
            <button
              type="button"
              onClick={() => setInputMode('draw')}
              className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors inline-flex items-center justify-center gap-1 ${
                inputMode === 'draw'
                  ? 'bg-[#1A7A6E] text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Draw on map
            </button>
            <button
              type="button"
              onClick={() => setInputMode('coords')}
              className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors inline-flex items-center justify-center gap-1 ${
                inputMode === 'coords'
                  ? 'bg-[#1A7A6E] text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Enter coords
            </button>
          </div>

          <button
            type="button"
            onClick={() => onDrawMode && onDrawMode(!isDrawing)}
            className="mt-2 w-full rounded-lg bg-[#1A7A6E] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#15635A]"
          >
            Select Area on Map
          </button>

          {/* Satellite Timeline */}
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
