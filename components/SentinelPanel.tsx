'use client';

import { useEffect, useState } from 'react';

export interface SentinelResult {
  image: string;
  bbox: [number, number, number, number];
  index: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  onResult: (result: SentinelResult | null) => void;
  onDrawMode: (active: boolean) => void;
  isDrawing: boolean;
  pendingBBox: [number, number, number, number] | null;
  onBBoxConsumed: () => void;
}

const INDICES = [
  { id: 'NDVI', label: 'Vegetation Health' },
  { id: 'NDWI', label: 'Water Index' },
  { id: 'NDMI', label: 'Soil Moisture' },
  { id: 'BSI', label: 'Bare Soil' },
  { id: 'EVI', label: 'Enhanced Vegetation' },
  { id: 'NBR', label: 'Burn / Recovery' },
];

const ANALYSIS: Record<
  string,
  { legend: string; bullets: string[]; certification: string }
> = {
  NDVI: {
    legend:
      'Dark red = bare/stressed (−0.5) → Dark green = dense healthy (1.0)',
    bullets: [
      'Values >0.5 indicate dense canopy — qualifies for agroforestry score',
      'Values 0.2–0.5 suggest moderate vegetation — intercropping potential',
      'Values <0.2 flag bare soil or stressed crops — deforestation risk',
      'Temporal decline month-over-month triggers a Mago alert',
    ],
    certification:
      'NDVI >0.4 required for Mago Agroforestry certification tier',
  },
  NDWI: {
    legend: 'Brown = dry (−1.0) → Blue = water saturated (1.0)',
    bullets: [
      'Values >0.3 indicate surface water or flooded fields',
      'Values 0.0–0.3 suggest adequate moisture for most crops',
      'Values <−0.2 flag drought stress — triggers irrigation advisory',
      'Negative trend over 60 days signals water scarcity risk',
    ],
    certification:
      'NDWI >0.0 during growing season supports Water Management score',
  },
  NDMI: {
    legend: 'Dark red = very dry (−1.0) → Dark blue = very wet (1.0)',
    bullets: [
      'Values >0.2 indicate sufficient moisture retention in soil',
      'Values 0.0–0.2 suggest moderate moisture — monitor in dry season',
      'Values <−0.2 indicate drought stress or compacted soil',
      'Correlates with bio-input effectiveness and soil carbon storage',
    ],
    certification: 'Consistent NDMI >0.1 supports Soil Health practice score',
  },
  BSI: {
    legend: 'Dark green = vegetated (−1.0) → Brown = bare soil (1.0)',
    bullets: [
      'High BSI (>0.2) identifies soil exposure and erosion risk areas',
      'Low BSI (<−0.2) confirms good ground cover — reduces runoff',
      'Post-harvest BSI spike is normal — monitor recovery speed',
      'Persistent high BSI flags non-compliance with cover crop rules',
    ],
    certification:
      'BSI <0.2 between growing seasons required for Soil Protection score',
  },
  EVI: {
    legend: 'Red = sparse (−0.2) → Dark green = lush forest (1.0)',
    bullets: [
      'More sensitive than NDVI in dense canopy areas',
      'Values >0.4 confirm established agroforestry systems',
      'Values <0.1 in forest zones flag potential clearing activity',
      'Used to detect shade-grown coffee and tea systems',
    ],
    certification:
      'EVI >0.35 required for premium shade-grown certification tier',
  },
  NBR: {
    legend: 'Orange = recently burned (−1.0) → Green = healthy unburned (1.0)',
    bullets: [
      'Negative values flag recent burning or severe vegetation loss',
      'Values 0.1–0.4 indicate recovering vegetation after disturbance',
      'Values >0.4 confirm healthy unburned vegetation',
      'Critical for EUDR deforestation-free compliance verification',
    ],
    certification:
      'NBR >0.2 required — negative values trigger deforestation flag',
  },
};

export default function SentinelPanel({
  onResult,
  onDrawMode,
  isDrawing,
  pendingBBox,
  onBBoxConsumed,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState('NDVI');
  const [dateFrom, setDateFrom] = useState('2024-10-01');
  const [dateTo, setDateTo] = useState('2025-03-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SentinelResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const [lockedBBox, setLockedBBox] =
    useState<[number, number, number, number] | null>(null);

  const [inputMode, setInputMode] = useState<'draw' | 'coords'>('draw');
  const [coordW, setCoordW] = useState('37.50');
  const [coordS, setCoordS] = useState('-0.10');
  const [coordE, setCoordE] = useState('37.90');
  const [coordN, setCoordN] = useState('0.30');
  const [coordError, setCoordError] = useState('');

  useEffect(() => {
    if (!pendingBBox) return;
    onBBoxConsumed();
    setLockedBBox(pendingBBox);
    fetchIndex(pendingBBox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingBBox]);

  function handleIndexChange(id: string) {
    setSelectedIndex(id);
    setResult(null);
    onResult(null);
    setShowAnalysis(false);
    if (lockedBBox) {
      fetchIndex(lockedBBox, id);
    }
  }

  function applyCoords() {
    setCoordError('');
    const w = parseFloat(coordW);
    const s = parseFloat(coordS);
    const e = parseFloat(coordE);
    const n = parseFloat(coordN);
    if (Number.isNaN(w) || Number.isNaN(s) || Number.isNaN(e) || Number.isNaN(n)) {
      setCoordError('All four coordinates must be valid numbers.');
      return;
    }
    if (e <= w) {
      setCoordError('East must be greater than West.');
      return;
    }
    if (n <= s) {
      setCoordError('North must be greater than South.');
      return;
    }
    if (w < -180 || e > 180 || s < -90 || n > 90) {
      setCoordError('Coordinates out of valid range.');
      return;
    }
    const bbox: [number, number, number, number] = [w, s, e, n];
    setLockedBBox(bbox);
    fetchIndex(bbox);
  }

  async function fetchIndex(
    bbox: [number, number, number, number],
    overrideIndex?: string
  ) {
    const idx = overrideIndex ?? selectedIndex;
    setLoading(true);
    setError('');
    setResult(null);
    onResult(null);
    setShowAnalysis(false);
    try {
      const tokenRes = await fetch('/api/sentinel/token', { method: 'POST' });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token)
        throw new Error('Auth failed — check credentials');

      const processRes = await fetch('/api/sentinel/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bbox,
          index: idx,
          dateFrom: new Date(dateFrom).toISOString(),
          dateTo: new Date(dateTo).toISOString(),
          token: tokenData.access_token,
        }),
      });
      const processData = await processRes.json();
      if (processData.error) throw new Error(processData.error);

      const r: SentinelResult = {
        image: processData.image,
        bbox,
        index: idx,
        dateFrom,
        dateTo,
      };
      setResult(r);
      onResult(r);
      setShowAnalysis(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }

  const indexInfo = INDICES.find((i) => i.id === selectedIndex)!;
  const analysisInfo = ANALYSIS[selectedIndex];

  return (
    <div className="absolute right-3 top-14 z-[1000] max-h-[calc(100vh-80px)] w-72 overflow-hidden overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
      <div className="sticky top-0 z-10 bg-[#1A7A6E] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white">
          🛰 Sentinel-2 Live Data
        </p>
        <p className="mt-0.5 text-[10px] text-white/70">
          ESA Copernicus Open Access
        </p>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Index
          </p>
          <div className="grid grid-cols-3 gap-1">
            {INDICES.map((idx) => (
              <button
                key={idx.id}
                type="button"
                onClick={() => handleIndexChange(idx.id)}
                className={`flex flex-col items-center rounded-lg border py-1.5 px-0.5 text-center transition-all ${
                  selectedIndex === idx.id
                    ? 'border-[#1A7A6E] bg-[#1A7A6E] text-white'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-[#1A7A6E]'
                }`}
              >
                <span className="text-[10px] font-semibold leading-tight">{idx.label}</span>
                <span className={`mt-0.5 text-[8px] opacity-50 ${selectedIndex === idx.id ? 'text-white' : 'text-gray-500'}`}>{idx.id}</span>
              </button>
            ))}
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

        {lockedBBox && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-emerald-700">
                  📌 AOI Locked
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-emerald-600">
                  W {lockedBBox[0].toFixed(3)} S {lockedBBox[1].toFixed(3)}
                </p>
                <p className="font-mono text-[9px] text-emerald-600">
                  E {lockedBBox[2].toFixed(3)} N {lockedBBox[3].toFixed(3)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLockedBBox(null);
                  setResult(null);
                  onResult(null);
                  setShowAnalysis(false);
                }}
                className="flex-shrink-0 rounded border border-emerald-300 px-2 py-1 text-[9px] text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Change Area
              </button>
            </div>
          </div>
        )}

        {!lockedBBox && (
          <>
            <div className="flex overflow-hidden rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setInputMode('draw')}
                className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors ${
                  inputMode === 'draw'
                    ? 'bg-[#1A7A6E] text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                ✏️ Draw on map
              </button>
              <button
                type="button"
                onClick={() => setInputMode('coords')}
                className={`flex-1 py-1.5 text-[10px] font-semibold transition-colors ${
                  inputMode === 'coords'
                    ? 'bg-[#1A7A6E] text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                🔢 Enter coords
              </button>
            </div>

            {inputMode === 'draw' && (
              <button
                type="button"
                onClick={() => onDrawMode(!isDrawing)}
                disabled={loading}
                className={`w-full rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  isDrawing
                    ? 'animate-pulse border border-amber-400 bg-amber-50 text-amber-700'
                    : 'bg-[#1A7A6E] text-white hover:bg-[#15635A]'
                } disabled:opacity-50`}
              >
                {isDrawing
                  ? '✏️ Draw rectangle on map…'
                  : '📐 Select Area on Map'}
              </button>
            )}

            {inputMode === 'coords' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    {
                      label: 'West (lng)',
                      value: coordW,
                      set: setCoordW,
                      placeholder: 'e.g. 37.50',
                    },
                    {
                      label: 'South (lat)',
                      value: coordS,
                      set: setCoordS,
                      placeholder: 'e.g. -0.10',
                    },
                    {
                      label: 'East (lng)',
                      value: coordE,
                      set: setCoordE,
                      placeholder: 'e.g. 37.90',
                    },
                    {
                      label: 'North (lat)',
                      value: coordN,
                      set: setCoordN,
                      placeholder: 'e.g. 0.30',
                    },
                  ].map(({ label, value, set, placeholder }) => (
                    <div key={label}>
                      <label className="text-[9px] text-gray-500">
                        {label}
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        placeholder={placeholder}
                        className="mt-0.5 w-full rounded border border-gray-200 px-1.5 py-1 font-mono text-[10px] outline-none focus:border-[#1A7A6E]"
                      />
                    </div>
                  ))}
                </div>
                {coordError && (
                  <p className="rounded bg-red-50 px-2 py-1 text-[9px] text-red-500">
                    ⚠️ {coordError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={applyCoords}
                  disabled={loading}
                  className="w-full rounded-lg bg-[#1A7A6E] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#15635A] disabled:opacity-50"
                >
                  Apply Coordinates →
                </button>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
            <div className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-[#1A7A6E] border-t-transparent" />
            <p className="text-[10px] text-blue-700">
              Fetching real satellite data…
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 text-[10px] text-red-600">
            ⚠️ {error}
          </p>
        )}

        {result && (
          <div className="space-y-2">
            <div className="rounded-lg bg-[#f0faf9] px-2.5 py-2 text-[10px]">
              <p className="font-semibold text-[#1A7A6E]">
                {result.index} — Real Sentinel-2 Data
              </p>
              <p className="mt-0.5 text-gray-500">
                {result.dateFrom} → {result.dateTo}
              </p>
              <p className="mt-0.5 text-gray-400">
                ESA Copernicus · 10m resolution
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="w-full rounded-lg border border-[#1A7A6E]/30 bg-[#f0faf9] py-2 text-[10px] font-semibold text-[#1A7A6E] transition-colors hover:bg-[#e0f5f3]"
            >
              {showAnalysis ? '▲ Hide Analysis' : '▼ Show Analysis'}
            </button>

            {showAnalysis && analysisInfo && (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                    Color Scale
                  </p>
                  <p className="text-[9px] leading-relaxed text-gray-600">
                    {analysisInfo.legend}
                  </p>
                </div>

                <div className="border-b border-gray-200 px-3 py-2">
                  <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                    Interpretation
                  </p>
                  <ul className="space-y-1.5">
                    {analysisInfo.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-[9px] leading-relaxed text-gray-600"
                      >
                        <span className="mt-0.5 flex-shrink-0 text-[#1A7A6E]">
                          ›
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 px-3 py-2">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                    🏅 Certification Relevance
                  </p>
                  <p className="text-[9px] leading-relaxed text-amber-800">
                    {analysisInfo.certification}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setResult(null);
                onResult(null);
                setShowAnalysis(false);
              }}
              className="w-full rounded-lg border border-gray-200 py-1.5 text-[10px] text-gray-500 transition-colors hover:border-red-300 hover:text-red-500"
            >
              Clear overlay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
