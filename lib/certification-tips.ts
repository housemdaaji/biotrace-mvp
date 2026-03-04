export interface ImprovementTip {
  practice: string;
  currentScore: number;
  maxScore: number;
  pointsAvailable: number;
  tip: string;
  action: string;
  timeframe: string;
}

const PRACTICE_TIPS: Record<
  string,
  { practice: string; tip: string; action: string; timeframe: string }
> = {
  soilScore: {
    practice: 'Soil Health (Cover Crops & Mulching)',
    tip: 'Cover crops and mulching are directly visible in Sentinel-2 NDVI trends — the fastest way to improve your satellite score.',
    action: 'Plant a fast-growing legume cover crop between your main crop rows this season.',
    timeframe: 'Visible in satellite data within 6–8 weeks',
  },
  waterScore: {
    practice: 'Water Management',
    tip: 'Water conservation practices reduce climate risk and are required for EUDR compliance documentation.',
    action: 'Install basic rainwater collection or drip irrigation on at least 30% of your land.',
    timeframe: 'Document and self-report immediately',
  },
  biodiversityScore: {
    practice: 'Biodiversity & Pesticide Reduction',
    tip: 'Reducing synthetic pesticide use protects biodiversity corridors monitored by satellite.',
    action: 'Switch to 1 organic pest control method (neem oil, trap crops, or beneficial insects).',
    timeframe: 'Report reduction at next monthly survey',
  },
  deforestationScore: {
    practice: 'Deforestation-Free Status',
    tip: 'Tree cover is the single most important satellite signal in BioTrace scoring. Even 5 trees/hectare qualifies as agroforestry.',
    action: 'Plant or protect existing trees on farm boundaries. Document with GPS photos.',
    timeframe: 'Canopy detectable in 3–4 months',
  },
  carbonScore: {
    practice: 'Agroforestry & Carbon Sequestration',
    tip: 'Agroforestry systems generate carbon proxy values that buyers use for ESG reporting — a key commercial differentiator.',
    action: 'Integrate fruit or timber trees into at least 20% of your farm area.',
    timeframe: 'Phase 2 carbon credit pathway available',
  },
};

export function getCertificationGap(farm: {
  aps: number;
  soilScore: number;
  waterScore: number;
  biodiversityScore: number;
  deforestationScore: number;
  carbonScore: number;
}): {
  gap: number;
  isEligible: boolean;
  topTips: ImprovementTip[];
  projectedAPS: number;
} {
  const THRESHOLD = 70;
  const gap = Math.max(0, THRESHOLD - farm.aps);
  const isEligible = farm.aps >= THRESHOLD;

  const scores = {
    soilScore: farm.soilScore,
    waterScore: farm.waterScore,
    biodiversityScore: farm.biodiversityScore,
    deforestationScore: farm.deforestationScore,
    carbonScore: farm.carbonScore,
  };

  // Sort practices by lowest score (most improvement potential)
  const sorted = (Object.entries(scores) as [keyof typeof scores, number][])
    .map(([key, current]) => ({
      key,
      current,
      available: 20 - current,
      ...PRACTICE_TIPS[key],
    }))
    .filter((t) => t.available > 0)
    .sort((a, b) => b.available - a.available)
    .slice(0, 3);

  const topTips: ImprovementTip[] = sorted.map((t) => ({
    practice: t.practice,
    currentScore: t.current,
    maxScore: 20,
    pointsAvailable: t.available,
    tip: t.tip,
    action: t.action,
    timeframe: t.timeframe,
  }));

  // Project APS if top tip is fully implemented
  const projectedGain = sorted[0]?.available ?? 0;
  const projectedAPS = Math.min(100, farm.aps + Math.round(projectedGain * 0.4));

  return { gap, isEligible, topTips, projectedAPS };
}
