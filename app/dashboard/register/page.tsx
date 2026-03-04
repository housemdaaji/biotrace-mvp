'use client';

import { useState } from 'react';
import Link from 'next/link';

const COOP_OPTIONS = [
  { value: 'kenyacoop-a', label: 'KenyaCoop-A — Meru North' },
  { value: 'kenyacoop-b', label: 'KenyaCoop-B — Meru Central' },
  { value: 'kenyacoop-c', label: 'KenyaCoop-C — Meru South' },
] as const;

const CROP_OPTIONS = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'cocoa', label: 'Cocoa' },
  { value: 'cashew', label: 'Cashew' },
  { value: 'cereals', label: 'Cereals' },
  { value: 'banana', label: 'Banana' },
] as const;

const PRACTICE_LABELS = ['Not Practised', 'Rarely', 'Sometimes', 'Often', 'Always'] as const;
const PRACTICE_VALUES = [0, 5, 10, 15, 20] as const;

const QUESTIONS = [
  'Do you use cover crops or mulching to protect soil?',
  'Do you compost or apply organic fertiliser?',
  'Have you reduced or eliminated synthetic pesticide use?',
  'Do you manage water through irrigation or rainwater harvesting?',
  'Do you maintain tree cover or agroforestry on your farm?',
];

const STORAGE_KEY = 'biotrace_registered_farms';

function getPracticeScoreLabel(score: number): string {
  if (score >= 70) return 'Certifiable';
  if (score >= 40) return 'Progressing';
  return 'Needs Improvement';
}

function getPracticeScoreColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getApsColor(score: number): string {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

export default function RegisterFarmPage() {
  const [farmerName, setFarmerName] = useState('');
  const [cooperativeId, setCooperativeId] = useState('');
  const [cropType, setCropType] = useState('');
  const [areaHa, setAreaHa] = useState<number | ''>('');
  const [plantingDate, setPlantingDate] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [practiceScores, setPracticeScores] = useState<number[]>([-1, -1, -1, -1, -1]);
  const [submitting, setSubmitting] = useState(false);
  const [successFarm, setSuccessFarm] = useState<{
    farmerName: string;
    apsScore: number;
    id: string;
  } | null>(null);

  const practiceScore = practiceScores.every((s) => s >= 0)
    ? practiceScores.reduce((sum, _, i) => sum + PRACTICE_VALUES[practiceScores[i]], 0)
    : 0;

  const practiceLabel = getPracticeScoreLabel(practiceScore);
  const practiceColor = getPracticeScoreColor(practiceScore);

  function useDemoCoordinates() {
    setLatitude(0.0472 + (Math.random() * 0.08 - 0.04));
    setLongitude(37.649 + (Math.random() * 0.08 - 0.04));
  }

  function resetForm() {
    setFarmerName('');
    setCooperativeId('');
    setCropType('');
    setAreaHa('');
    setPlantingDate('');
    setLatitude('');
    setLongitude('');
    setPracticeScores([-1, -1, -1, -1, -1]);
    setSuccessFarm(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !farmerName.trim() ||
      !cooperativeId ||
      !cropType ||
      areaHa === '' ||
      Number(areaHa) < 0.1 ||
      Number(areaHa) > 500 ||
      !plantingDate ||
      latitude === '' ||
      longitude === '' ||
      practiceScores.some((s) => s < 0)
    ) {
      return;
    }
    setSubmitting(true);

    const ndvi_mock = 0.45 + Math.random() * 0.3;
    const ndvi_trend_score = ndvi_mock * 100;
    let aps = Math.round(ndvi_trend_score * 0.4 + practiceScore * 0.4);
    aps = Math.min(100, Math.max(0, aps));

    const lat = Number(latitude);
    const lng = Number(longitude);
    const delta = 0.0009;
    const id = 'farm-' + Date.now();
    const certified = aps >= 70;

    const farm = {
      id,
      cooperativeId,
      farmerName: farmerName.trim(),
      lat,
      lng,
      apsScore: aps,
      soilScore: practiceScore,
      waterScore: practiceScore,
      biodiversityScore: practiceScore,
      deforestationScore: practiceScore,
      carbonScore: practiceScore,
      certificateId: certified ? `BT-KE-2024-${String(id).slice(-6)}` : null,
      certificateDate: certified ? new Date().toISOString().slice(0, 10) : null,
      status: (certified ? 'certified' : 'pending') as 'certified' | 'pending' | 'at-risk',
      boundary: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [lng - delta, lat - delta],
            [lng + delta, lat - delta],
            [lng + delta, lat + delta],
            [lng - delta, lat + delta],
            [lng - delta, lat - delta],
          ],
        ],
      },
      deforestationRisk: false,
    };

    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, farm]));
      setSuccessFarm({ farmerName: farmerName.trim(), apsScore: aps, id: farm.id });
    } finally {
      setSubmitting(false);
    }
  }

  if (successFarm) {
    const color = getApsColor(successFarm.apsScore);
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Farm Registration</h1>
          <p className="mt-2 text-sm text-gray-600">Cooperative manager flow</p>
        </header>
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">✅ Farm Registered Successfully</h2>
            <p className="mt-4 text-gray-700">
              <span className="font-medium">{successFarm.farmerName}&apos;s Farm</span>
            </p>
            <p className="mt-2 flex items-center gap-2">
              <span className="font-medium text-gray-600">APS Score:</span>
              <span className="font-bold" style={{ color }}>
                {successFarm.apsScore}
              </span>
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            </p>
            {successFarm.apsScore >= 70 && (
              <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-medium text-emerald-800">
                Certified
              </span>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#1A7A6E] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A7A6E] hover:bg-[#f0faf9] transition-colors"
              >
                Register Another Farm
              </button>
              <Link
                href="/map"
                className="inline-flex items-center rounded-lg bg-[#1A7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15635A] transition-colors"
              >
                View on Map
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Farm Registration</h1>
        <p className="mt-2 text-sm text-gray-600">Cooperative manager flow</p>
      </header>

      <div className="mx-auto max-w-[680px] px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg sm:p-8"
        >
          {/* Section 1 */}
          <h2 className="border-b border-gray-100 pb-2 text-base font-semibold text-[#1A7A6E]">
            Farmer & Farm Identity
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="farmerName" className="mb-1 block text-sm font-medium text-gray-700">
                Farmer Name *
              </label>
              <input
                id="farmerName"
                type="text"
                required
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
              />
            </div>
            <div>
              <label htmlFor="cooperativeId" className="mb-1 block text-sm font-medium text-gray-700">
                Cooperative ID *
              </label>
              <select
                id="cooperativeId"
                required
                value={cooperativeId}
                onChange={(e) => setCooperativeId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
              >
                <option value="">Select cooperative</option>
                {COOP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cropType" className="mb-1 block text-sm font-medium text-gray-700">
                Crop Type *
              </label>
              <select
                id="cropType"
                required
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
              >
                <option value="">Select crop</option>
                {CROP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="areaHa" className="mb-1 block text-sm font-medium text-gray-700">
                Land Area (hectares) *
              </label>
              <input
                id="areaHa"
                type="number"
                min={0.1}
                max={500}
                step={0.1}
                required
                value={areaHa}
                onChange={(e) => setAreaHa(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
              />
            </div>
            <div>
              <label htmlFor="plantingDate" className="mb-1 block text-sm font-medium text-gray-700">
                Planting Date *
              </label>
              <input
                id="plantingDate"
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
              />
            </div>
          </div>

          {/* Section 2 */}
          <h2 className="mt-8 border-b border-gray-100 pb-2 text-base font-semibold text-[#1A7A6E]">
            GPS Coordinates
          </h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lat" className="mb-1 block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  id="lat"
                  type="number"
                  step={0.000001}
                  placeholder="-0.05 to 0.30"
                  value={latitude}
                  onChange={(e) =>
                    setLatitude(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
                />
              </div>
              <div>
                <label htmlFor="lng" className="mb-1 block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  id="lng"
                  type="number"
                  step={0.000001}
                  placeholder="37.50 to 37.90"
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Use Google Maps → right-click your farm → copy coordinates
            </p>
            <button
              type="button"
              onClick={useDemoCoordinates}
              className="rounded-lg border border-[#1A7A6E] bg-white px-4 py-2 text-sm font-medium text-[#1A7A6E] hover:bg-[#f0faf9] transition-colors"
            >
              Use Meru County Demo Coordinates
            </button>
          </div>

          {/* Section 3 */}
          <h2 className="mt-8 border-b border-gray-100 pb-2 text-base font-semibold text-[#1A7A6E]">
            Agroecological Practices (Self-Reported)
          </h2>
          <div className="mt-4 space-y-6">
            {QUESTIONS.map((q, qIdx) => (
              <div key={qIdx}>
                <p className="mb-2 text-sm font-medium text-gray-700">{q}</p>
                <div className="flex flex-wrap gap-1">
                  {PRACTICE_LABELS.map((label, oIdx) => {
                    const selected = practiceScores[qIdx] === oIdx;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const next = [...practiceScores];
                          next[qIdx] = oIdx;
                          setPracticeScores(next);
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-[#1A7A6E] bg-[#1A7A6E] text-white'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Practice Score Preview */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Practice Score Preview</p>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${practiceScore}%`,
                    backgroundColor: '#1A7A6E',
                  }}
                />
              </div>
              <p className="mt-2 text-sm" style={{ color: practiceColor }}>
                {practiceScore} / 100 — {practiceLabel}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 w-full rounded-lg bg-[#1A7A6E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#15635A] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Registering...' : 'Register Farm'}
          </button>
        </form>
      </div>
    </main>
  );
}
