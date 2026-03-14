'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import farmsData from '@/data/farms.json';
import cooperativesData from '@/data/cooperatives.json';
import { QRCodeSVG } from 'qrcode.react';
import EUDRPanel, { type EUDRPanelFarm } from '@/components/EUDRPanel';
import GlobalNav from '@/components/GlobalNav';
import { MedalIcon, CheckIcon, DocumentIcon, ChartIcon, GlobeIcon, RefreshIcon, AlertIcon } from '@/components/Icons';

interface FarmRecord {
  id: string;
  cooperativeId: string;
  farmer: string;
  apsScore: number;
  name?: string;
  country?: string;
  crop?: string;
}

interface CooperativeRecord {
  id: string;
  name: string;
  country: string;
  crop: string;
}

function toPanelFarm(farm: FarmRecord, cooperativeName: string, crop?: string, country?: string): EUDRPanelFarm {
  return {
    id: farm.id,
    name: farm.id,
    farmer: farm.farmer,
    cooperative: cooperativeName,
    apsScore: farm.apsScore,
    crop,
    country,
  };
}

function getEudrBadge(apsScore: number): { label: string; className: string; Icon: typeof CheckIcon } {
  if (apsScore >= 60) return { label: 'Certified', className: 'bg-green-100 text-green-700', Icon: CheckIcon };
  if (apsScore >= 40) return { label: 'Pending Review', className: 'bg-amber-100 text-amber-700', Icon: RefreshIcon };
  return { label: 'Action Required', className: 'bg-red-100 text-red-700', Icon: AlertIcon };
}

function getScoreColor(apsScore: number): string {
  if (apsScore >= 70) return 'text-[#1A7A6E]';
  if (apsScore >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export default function EUDRPage() {
  const farms = farmsData as FarmRecord[];
  const cooperatives = cooperativesData as CooperativeRecord[];
  const coopById = useMemo(() => {
    const m = new Map<string, CooperativeRecord>();
    cooperatives.forEach((c) => m.set(c.id, c));
    return m;
  }, [cooperatives]);

  const [selectedFarm, setSelectedFarm] = useState<EUDRPanelFarm | null>(null);
  const [selectedFarmForQR, setSelectedFarmForQR] = useState<FarmRecord | null>(null);
  const [countryFilter, setCountryFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const handleShowQR = (farm: FarmRecord) => {
    setSelectedFarmForQR(farm);
  };

  const handleDownloadReport = (farm: FarmRecord) => {
    const cooperativeName = coopById.get(farm.cooperativeId)?.name ?? farm.cooperativeId;
    const content = [
      'MAGO AGROECOLOGY CERTIFICATION REPORT',
      '======================================',
      '',
      `Farm: ${farm.name ?? farm.farmer}`,
      `Cooperative: ${cooperativeName}`,
      `Country: ${farm.country ?? '—'}`,
      `Crop: ${farm.crop ?? '—'}`,
      `APS Score: ${farm.apsScore}`,
      'Status: Certified',
      `Report generated: ${new Date().toLocaleDateString()}`,
      '',
      'Certified by Mago Agroecology Platform',
      'Powered by Sentinel-2 satellite data',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mago-report-${farm.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const certifiedFarms = useMemo(() => {
    return farms.filter((farm) => {
      const isCertified = farm.apsScore >= 50;
      const matchesCountry = !countryFilter || farm.country === countryFilter;
      const matchesSector = !sectorFilter || farm.crop === sectorFilter;
      return isCertified && matchesCountry && matchesSector;
    });
  }, [farms, countryFilter, sectorFilter]);

  const panelFarms = useMemo(
    () =>
      farms.map((f) => {
        const coop = coopById.get(f.cooperativeId);
        return toPanelFarm(f, coop?.name ?? '—', coop?.crop, coop?.country);
      }),
    [farms, coopById]
  );

  const stats = useMemo(() => {
    const compliant = farms.filter((f) => f.apsScore >= 60).length;
    const pending = farms.filter((f) => f.apsScore >= 40 && f.apsScore < 60).length;
    const action = farms.filter((f) => f.apsScore < 40).length;
    const coopIds = new Set(farms.map((f) => f.cooperativeId));
    return { cooperatives: coopIds.size, compliant, pending, action };
  }, [farms]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GlobalNav activePage="eudr" />
      <div className="mx-auto max-w-5xl w-full px-4 py-8">
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Certification Center</h1>
        <p className="mt-1 text-sm text-gray-600">
          EU Deforestation Regulation 2023/1115 — Due Diligence Dashboard
        </p>

        {/* Summary stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Cooperatives Assessed', value: stats.cooperatives, Icon: GlobeIcon },
            { label: 'Certified Farms', value: stats.compliant, Icon: CheckIcon },
            { label: 'Pending Review', value: stats.pending, Icon: RefreshIcon },
            { label: 'Action Required', value: stats.action, Icon: AlertIcon },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-[#1A7A6E]">{s.value}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                <s.Icon className="w-4 h-4" /> {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Farm list */}
        <h2 className="mt-10 text-lg font-semibold text-gray-900">Farms</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {panelFarms.map((pf) => {
            const badge = getEudrBadge(pf.apsScore);
            const BadgeIcon = badge.Icon;
            return (
              <div
                key={pf.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="font-semibold text-gray-900">{pf.id}</p>
                <p className="text-sm text-gray-600">{pf.farmer}</p>
                <p className="text-xs text-gray-500">{pf.cooperative}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${getScoreColor(pf.apsScore)}`}>
                    APS: {pf.apsScore}/100
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1 ${badge.className}`}>
                    <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFarm(pf)}
                  className="mt-3 w-full rounded-lg bg-[#1A7A6E] py-2 text-sm font-medium text-white hover:bg-[#15635A]"
                >
                  View Full Report →
                </button>
              </div>
            );
          })}
        </div>

        {/* Certified Farms */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-[#2D5A2E] mb-4 inline-flex items-center gap-2">
            <MedalIcon /> Certified Farms
          </h2>

          <div className="flex gap-3 mb-6 flex-wrap">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
            >
              <option value="">All Countries</option>
              <option value="Kenya">Kenya</option>
              <option value="Tunisia">Tunisia</option>
              <option value="Morocco">Morocco</option>
            </select>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
            >
              <option value="">All Sectors</option>
              <option value="Coffee">Coffee</option>
              <option value="Tea">Tea</option>
              <option value="Cocoa">Cocoa</option>
              <option value="Olive">Olive</option>
            </select>

            {(countryFilter || sectorFilter) && (
              <button
                type="button"
                onClick={() => { setCountryFilter(''); setSectorFilter(''); }}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="space-y-3">
            {certifiedFarms.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No certified farms match the selected filters.
              </p>
            ) : (
              certifiedFarms.map((farm) => {
                const cooperativeName = coopById.get(farm.cooperativeId)?.name ?? '—';
                return (
                  <div
                    key={farm.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{farm.name ?? farm.farmer}</p>
                      <p className="text-sm text-gray-500">
                        {cooperativeName} · {farm.country ?? '—'} · {farm.crop ?? '—'}
                      </p>
                      <p className="text-sm mt-1">
                        APS Score:{' '}
                        <span className="font-bold text-[#2D5A2E]">
                          {farm.apsScore}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium inline-flex items-center">
                        <CheckIcon className="w-3.5 h-3.5" /> Certified
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleShowQR(farm)}
                          className="text-xs bg-[#2D5A2E] text-white px-3 py-1.5 rounded hover:bg-[#4A8C35] transition-colors inline-flex items-center gap-1"
                        >
                          <DocumentIcon className="w-3.5 h-3.5" /> Certificate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadReport(farm)}
                          className="text-xs border border-[#2D5A2E] text-[#2D5A2E] px-3 py-1.5 rounded hover:bg-green-50 transition-colors inline-flex items-center gap-1"
                        >
                          <ChartIcon className="w-3.5 h-3.5" /> Report
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedFarmForQR && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setSelectedFarmForQR(null)}
            >
              <div
                className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-bold text-lg text-[#2D5A2E] mb-1 inline-flex items-center gap-2">
                  <MedalIcon /> Agroecology Certificate
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedFarmForQR.name ?? selectedFarmForQR.farmer}
                </p>

                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 mb-4">
                  <QRCodeSVG
                    value={`https://biotrace-mvp.vercel.app/certificate/${selectedFarmForQR.id}`}
                    size={180}
                    level="M"
                  />
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    Score: <span className="font-bold text-[#2D5A2E]">{selectedFarmForQR.apsScore}</span>
                  </p>
                  <p>Crop: {selectedFarmForQR.crop ?? '—'}</p>
                  <p>Country: {selectedFarmForQR.country ?? '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFarmForQR(null)}
                  className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="mt-10 rounded-lg bg-[#1A7A6E] px-4 py-3 text-sm text-white">
          The EU Deforestation Regulation requires all operators placing products on the EU market to conduct due diligence to ensure their products are deforestation-free and legally produced. Mago automates this process using ESA Copernicus Sentinel-2 satellite data.
        </div>
      </div>

      {/* Modal */}
      {selectedFarm && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedFarm(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <EUDRPanel farm={selectedFarm} onClose={() => setSelectedFarm(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
