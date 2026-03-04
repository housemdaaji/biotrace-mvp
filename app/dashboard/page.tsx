'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

import cooperativesData from '@/data/cooperatives.json';
import farmsData from '@/data/farms.json';

type Cooperative = (typeof cooperativesData)[number];
type Farm = (typeof farmsData)[number];

function getApsColor(score: number): string {
  if (score >= 70) return '#1A7A6E';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatStatus(status: string): string {
  if (status === 'certified') return 'Certified';
  if (status === 'pending') return 'Pending';
  if (status === 'at-risk') return 'At-Risk';
  return status;
}

function generateTimelineData(currentScore: number): { month: string; score: number }[] {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const startScore = Math.max(0, currentScore - 10);
  const step = (currentScore - startScore) / 5;
  return months.map((month, i) => ({
    month,
    score: Math.round(startScore + step * i),
  }));
}

const PRACTICE_LABELS: { key: keyof Farm; label: string }[] = [
  { key: 'soilScore', label: 'Soil Health' },
  { key: 'waterScore', label: 'Water Management' },
  { key: 'biodiversityScore', label: 'Biodiversity' },
  { key: 'deforestationScore', label: 'Deforestation-Free Status' },
  { key: 'carbonScore', label: 'Carbon Proxy' },
];

export default function DashboardPage() {
  const cooperatives = cooperativesData as Cooperative[];
  const farms = farmsData as Farm[];
  const [selectedCoopId, setSelectedCoopId] = useState<string>(cooperatives[0].id);

  const selectedCoop = useMemo(
    () => cooperatives.find((c) => c.id === selectedCoopId) ?? cooperatives[0],
    [cooperatives, selectedCoopId]
  );

  const coopFarms = useMemo(
    () => farms.filter((f) => f.cooperativeId === selectedCoopId),
    [farms, selectedCoopId]
  );

  const practiceAverages = useMemo(() => {
    if (coopFarms.length === 0) return [];
    return PRACTICE_LABELS.map(({ key, label }) => {
      const sum = coopFarms.reduce((acc, f) => acc + (f[key] as number), 0);
      const avg = Math.round(sum / coopFarms.length);
      return { name: label, value: avg };
    });
  }, [coopFarms]);

  const timelineData = useMemo(
    () => generateTimelineData(selectedCoop.apsScore),
    [selectedCoop.apsScore]
  );

  const firstCertifiedFarm = useMemo(
    () => coopFarms.find((f) => f.status === 'certified' && f.certificateId),
    [coopFarms]
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Cooperative Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Agroecological Practice Scores & Certification Status
        </p>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Cooperative selector */}
        <div className="mb-6">
          <label htmlFor="coop-select" className="mb-2 block text-sm font-medium text-gray-700">
            Select cooperative
          </label>
          <select
            id="coop-select"
            value={selectedCoopId}
            onChange={(e) => setSelectedCoopId(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-[#1A7A6E] focus:outline-none focus:ring-1 focus:ring-[#1A7A6E]"
          >
            {cooperatives.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left column: summary, charts, table */}
          <div className="space-y-6">
            {/* Cooperative Summary Card */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{selectedCoop.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{selectedCoop.location}</p>
              <div className="mt-4 flex flex-wrap items-baseline gap-6">
                <div>
                  <span className="text-sm text-gray-500">Total farmers</span>
                  <p className="text-xl font-semibold text-gray-900">{selectedCoop.farmerCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Certified farmers</span>
                  <p className="text-xl font-semibold text-gray-900">{selectedCoop.certifiedFarmers.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">APS Score</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: getApsColor(selectedCoop.apsScore) }}
                    >
                      {selectedCoop.apsScore}
                    </span>
                    <span
                      className="text-2xl"
                      style={{ color: selectedCoop.apsScore >= 60 ? '#1A7A6E' : '#EF4444' }}
                      aria-hidden
                    >
                      {selectedCoop.apsScore >= 60 ? '↑' : '↓'}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p><span className="font-medium">Crop:</span> {selectedCoop.crop}</p>
                  <p className="mt-0.5">Last updated {formatDate(selectedCoop.lastUpdated)}</p>
                </div>
              </div>
            </section>

            {/* Practice Score Breakdown */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Practice Score Breakdown</h3>
              <p className="mt-1 text-sm text-gray-600">Average scores for farms in this cooperative</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={practiceAverages}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [value, 'Score']} />
                    <Bar dataKey="value" fill="#1A7A6E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Monthly APS Timeline */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Monthly APS Timeline</h3>
              <p className="mt-1 text-sm text-gray-600">6-month trend (mock data)</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#1A7A6E"
                      strokeWidth={2}
                      dot={{ fill: '#1A7A6E' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Farms Table */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Farms</h3>
                <p className="text-sm text-gray-600">All farms in this cooperative</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Farmer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        APS Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Soil
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Water
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Biodiversity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {coopFarms.map((farm) => (
                      <tr key={farm.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {farm.farmerName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                            style={{ backgroundColor: getApsColor(farm.apsScore) }}
                          >
                            {farm.apsScore}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              farm.status === 'certified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : farm.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {formatStatus(farm.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{farm.soilScore}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{farm.waterScore}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{farm.biodiversityScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right column: Digital Certificate Panel */}
          <div className="lg:order-none">
            <section className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Digital Certificate</h3>
              {firstCertifiedFarm ? (
                <>
                  <p className="mt-2 font-mono text-sm text-gray-700">{firstCertifiedFarm.certificateId}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Issue date: {formatDate(firstCertifiedFarm.certificateDate ?? '')}
                  </p>
                  <div className="mt-6 flex justify-center rounded-lg border border-gray-200 bg-white p-4">
                    <QRCodeSVG
                      value={`https://biotrace.app/verify/${firstCertifiedFarm.certificateId}`}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-[#1A7A6E] px-4 py-1.5 text-sm font-medium text-white">
                      BioTrace Verified
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-6 w-full rounded-lg bg-[#1A7A6E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#145c52] transition-colors"
                  >
                    Download Certificate
                  </button>
                </>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No certified farm in this cooperative yet.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
