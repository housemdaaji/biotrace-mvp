'use client';

import { LeafIcon, CheckIcon, AlertIcon, DocumentIcon, MetricIcon } from '@/components/Icons';
import type { MetricIconKey } from '@/components/Icons';

export interface MetricItem {
  iconKey: MetricIconKey;
  name: string;
  score: number;
  unit: string;
  certified: boolean;
}

export interface MagoScoreCardProps {
  farmName?: string;
  overallScore: number;
  metrics: MetricItem[];
  onGenerateReport?: () => void;
}

const DEFAULT_METRICS: MetricItem[] = [
  { iconKey: 'deforestation', name: 'Deforestation-Free Compliance', score: 58, unit: '/100', certified: true },
  { iconKey: 'agroecology', name: 'Agroecology Practice Score', score: 58, unit: '/100', certified: false },
  { iconKey: 'biodiversity', name: 'Biodiversity Score', score: 66, unit: '/100', certified: true },
  { iconKey: 'carbon', name: 'Carbon Footprint', score: 54, unit: 'tCO₂/ha', certified: false },
  { iconKey: 'water', name: 'Water Footprint', score: 47, unit: 'm³/ha', certified: true },
];

const DEFAULT_SCORE = 63;

function getMarkerColorClass(score: number): string {
  if (score < 30) return 'text-red-500';
  if (score < 50) return 'text-orange-500';
  if (score < 65) return 'text-yellow-500';
  if (score < 80) return 'text-green-400';
  return 'text-green-600';
}

export default function MagoScoreCard({
  farmName,
  overallScore = DEFAULT_SCORE,
  metrics = DEFAULT_METRICS,
  onGenerateReport,
}: MagoScoreCardProps) {
  const score = Math.min(100, Math.max(0, overallScore));
  const onTrack = score >= 70;
  const improvementCount = metrics.filter((m) => !m.certified).length;
  const isCertified = improvementCount === 0;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
      {farmName && (
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">{farmName}</p>
      )}

      {/* Section 1 — Header Score (with logo for print/certificate) */}
      <div className="mb-2 flex items-center gap-3">
        <span className="text-sm font-bold text-[#2D5A2E] inline-flex items-center gap-1"><LeafIcon className="w-4 h-4" /> Mago</span>
        <span className="text-sm font-semibold tracking-wide text-gray-600">Sustainability Score</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-5xl font-black text-gray-900">{score}</span>
        <span className="text-xl font-medium text-gray-400">/ 100</span>
      </div>

      {/* Section 2 — Gradient Score Bar */}
      <div className="relative mt-4">
        <div
          className="h-3 w-full rounded-full"
          style={{
            background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #84cc16, #22c55e)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${score}%`, transform: 'translate(-50%, -50%)' }}
        >
          <span className={`text-lg leading-none ${getMarkerColorClass(score)}`} aria-hidden>▲</span>
        </div>
      </div>
      <div className="mt-2">
        {onTrack ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <CheckIcon className="w-3.5 h-3.5 mr-0.5" /> On Track &gt;
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <AlertIcon className="w-3.5 h-3.5 mr-0.5" /> Improvement Required &gt;
          </span>
        )}
      </div>

      {/* Section 3 — Metric Rows */}
      <div className="mt-6 space-y-2">
        {metrics.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#2D5A2E]">
              <MetricIcon iconKey={m.iconKey} className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-500">
                {m.unit.startsWith('/') ? `${m.score}${m.unit}` : `${m.score} ${m.unit}`}
              </p>
            </div>
            {m.certified ? (
              <span className="shrink-0 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                <CheckIcon className="w-3.5 h-3.5" /> Certified &gt;
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                <AlertIcon className="w-3.5 h-3.5" /> Improvement Required &gt;
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Section 4 — Certification Status Footer */}
      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <p className="text-sm font-bold text-gray-800">
          Certification Status{' '}
          {isCertified ? (
            <span className="inline-flex items-center font-semibold text-green-600"><CheckIcon className="w-4 h-4" /> Certified</span>
          ) : (
            <span className="inline-flex items-center font-semibold text-amber-600"><AlertIcon className="w-4 h-4" /> Not Yet Certified</span>
          )}
        </p>
        {!isCertified && (
          <p className="mt-0.5 text-xs text-gray-500">
            {improvementCount} criteria require improvement
          </p>
        )}
        <button
          type="button"
          onClick={() => onGenerateReport?.()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D5A45] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#234535]"
        >
          <DocumentIcon className="w-4 h-4" /> Generate Certification Report
        </button>
      </div>
    </div>
  );
}
