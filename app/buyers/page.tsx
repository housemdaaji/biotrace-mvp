'use client';

import { useMemo, useState } from 'react';

import cooperativesData from '@/data/cooperatives.json';
import farmsData from '@/data/farms.json';

type Cooperative = (typeof cooperativesData)[number];
type Farm = (typeof farmsData)[number];

const MIN_APS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '40', label: '40+' },
  { value: '60', label: '60+' },
  { value: '70', label: '70+' },
];

function getApsColor(score: number): string {
  if (score >= 70) return '#1A7A6E';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

const PRACTICE_KEYS: { key: keyof Farm; label: string }[] = [
  { key: 'soilScore', label: 'Soil Health' },
  { key: 'waterScore', label: 'Water Management' },
  { key: 'biodiversityScore', label: 'Biodiversity' },
  { key: 'deforestationScore', label: 'Deforestation-Free' },
  { key: 'carbonScore', label: 'Carbon Proxy' },
];

interface CooperativeWithMetrics extends Cooperative {
  avgDeforestationScore: number;
  practiceAverages: Record<string, number>;
  certifiedFarmsCount: number;
}

function useCooperativesWithMetrics(
  cooperatives: Cooperative[],
  farms: Farm[]
): CooperativeWithMetrics[] {
  return useMemo(() => {
    return cooperatives.map((coop) => {
      const coopFarms = farms.filter((f) => f.cooperativeId === coop.id);
      const certifiedFarmsCount = coopFarms.filter((f) => f.status === 'certified').length;
      const avgDeforestationScore =
        coopFarms.length > 0
          ? Math.round(
              coopFarms.reduce((s, f) => s + f.deforestationScore, 0) / coopFarms.length
            )
          : 0;
      const practiceAverages: Record<string, number> = {};
      PRACTICE_KEYS.forEach(({ key }) => {
        if (coopFarms.length > 0) {
          const sum = coopFarms.reduce((acc, f) => acc + (f[key] as number), 0);
          practiceAverages[key] = Math.round(sum / coopFarms.length);
        } else {
          practiceAverages[key] = 0;
        }
      });
      return {
        ...coop,
        avgDeforestationScore,
        practiceAverages,
        certifiedFarmsCount,
      };
    });
  }, [cooperatives, farms]);
}

export default function BuyersPage() {
  const cooperatives = cooperativesData as Cooperative[];
  const farms = farmsData as Farm[];
  const coopWithMetrics = useCooperativesWithMetrics(cooperatives, farms);

  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [minAps, setMinAps] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const cropOptions = useMemo(() => {
    const crops = Array.from(new Set(cooperatives.map((c) => c.crop).filter(Boolean)));
    return crops.sort();
  }, [cooperatives]);

  const filtered = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    const minApsNum = minAps === '' ? 0 : parseInt(minAps, 10);
    return coopWithMetrics.filter((coop) => {
      if (searchLower) {
        const matchName = coop.name.toLowerCase().includes(searchLower);
        const matchLocation = coop.location.toLowerCase().includes(searchLower);
        if (!matchName && !matchLocation) return false;
      }
      if (cropFilter && coop.crop !== cropFilter) return false;
      if (coop.apsScore < minApsNum) return false;
      return true;
    });
  }, [coopWithMetrics, search, cropFilter, minAps]);

  const totalCount = coopWithMetrics.length;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Buyer & Market Portal
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Discover EUDR-compliant, verified agroecological cooperatives
        </p>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Search and filter bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Cooperative name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 shadow-sm focus:border-[#1A7A6E] focus:outline-none focus:ring-1 focus:ring-[#1A7A6E]"
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="crop" className="mb-1 block text-sm font-medium text-gray-700">
              Crop type
            </label>
            <select
              id="crop"
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-[#1A7A6E] focus:outline-none focus:ring-1 focus:ring-[#1A7A6E]"
            >
              <option value="">All crops</option>
              {cropOptions.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="min-aps" className="mb-1 block text-sm font-medium text-gray-700">
              Min. APS score
            </label>
            <select
              id="min-aps"
              value={minAps}
              onChange={(e) => setMinAps(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-[#1A7A6E] focus:outline-none focus:ring-1 focus:ring-[#1A7A6E]"
            >
              {MIN_APS_OPTIONS.map((opt) => (
                <option key={opt.value || 'any'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Showing {filtered.length} of {totalCount} verified cooperatives
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
            <p className="text-gray-600">
              No cooperatives match your filters. Try adjusting your search.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((coop) => {
              const isExpanded = expandedId === coop.id;
              const carbonEstimate = Math.round(coop.apsScore * 0.12);
              const showBioTrace = coop.apsScore >= 60;
              const showDeforestationFree = coop.avgDeforestationScore >= 80;
              const showEudr = coop.avgDeforestationScore >= 80;

              return (
                <div key={coop.id} className="flex flex-col">
                  <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">{coop.name}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {coop.country} · {coop.crop}
                    </p>
                    <div className="mt-3">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold text-white"
                        style={{ backgroundColor: getApsColor(coop.apsScore) }}
                      >
                        APS {coop.apsScore}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {coop.farmerCount.toLocaleString()} farmers · {coop.certifiedFarmers.toLocaleString()} certified
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {showBioTrace && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[#1A7A6E]">
                          ✓ BioTrace Verified
                        </span>
                      )}
                      {showDeforestationFree && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[#1A7A6E]">
                          ✓ Deforestation-Free
                        </span>
                      )}
                      {showEudr && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[#1A7A6E]">
                          ✓ EUDR Compliant
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      ~{carbonEstimate} t CO₂/ha/yr
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : coop.id)}
                      className="mt-4 w-full rounded-lg bg-[#1A7A6E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#145c52] transition-colors"
                    >
                      {isExpanded ? 'Hide Profile' : 'View Profile'}
                    </button>
                  </article>

                  {isExpanded && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-semibold text-gray-900">ESG Summary</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {coop.farmerCount.toLocaleString()} farmers across {coop.certifiedFarmsCount} certified
                        farms practicing agroecology in {coop.location}. APS score: {coop.apsScore}. Crop:{' '}
                        {coop.crop}.
                      </p>
                      <div className="mt-4 space-y-2">
                        {PRACTICE_KEYS.map(({ key, label }) => (
                          <div key={key}>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">{label}</span>
                              <span className="font-medium text-gray-900">
                                {coop.practiceAverages[key] ?? 0}%
                              </span>
                            </div>
                            <div className="mt-0.5 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-[#1A7A6E]"
                                style={{
                                  width: `${Math.min(100, coop.practiceAverages[key] ?? 0)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <a
                          href={`mailto:contact@${coop.id}.example.com`}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Contact Cooperative
                        </a>
                        <button
                            type="button"
                            title="Full PDF available in Phase 2"
                            className="group relative rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Download ESG Report
                            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                              Full PDF available in Phase 2
                            </span>
                          </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
