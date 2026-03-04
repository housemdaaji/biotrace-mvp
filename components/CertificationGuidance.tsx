'use client';

import { getCertificationGap } from '@/lib/certification-tips';

interface Props {
  farm: {
    name: string;
    aps: number;
    soilScore: number;
    waterScore: number;
    biodiversityScore: number;
    deforestationScore: number;
    carbonScore: number;
  };
}

export default function CertificationGuidance({ farm }: Props) {
  const { gap, isEligible, topTips, projectedAPS } = getCertificationGap(farm);

  if (isEligible)
    return (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>🏆</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Certification Eligible</p>
            <p className="text-xs text-green-600">
              This farm meets the APS ≥ 70 threshold. A digital certificate has been issued.
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-800">Path to Certification</p>
          <p className="text-xs text-amber-600">{gap} points needed to reach APS 70</p>
        </div>
      </div>

      {/* Top improvement tips */}
      <div className="space-y-3">
        {topTips.map((t, i) => (
          <div
            key={t.practice}
            className="rounded-lg border border-amber-100 bg-white p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-amber-800">
                {i + 1}. {t.practice}
              </span>
              <span className="shrink-0 text-xs text-gray-500">
                {t.currentScore}/{t.maxScore} → +{t.pointsAvailable} pts
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-600">{t.tip}</p>
            <p className="mt-1 text-xs font-medium text-gray-800">Action: {t.action}</p>
            <p className="mt-0.5 text-xs italic text-gray-500">{t.timeframe}</p>
          </div>
        ))}
      </div>

      {/* Projected APS */}
      {topTips.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-white px-3 py-2">
          <p className="text-xs text-gray-600">
            Implementing the top recommendation could raise your APS to{' '}
            <span className="font-semibold text-amber-800">~{projectedAPS}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
