'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import farmsData from '@/data/farms.json';

const COOP_OPTIONS = [
  { value: 'kenyacoop-a', label: 'KenyaCoop-A — Meru North' },
  { value: 'kenyacoop-b', label: 'KenyaCoop-B — Meru Central' },
  { value: 'kenyacoop-c', label: 'KenyaCoop-C — Meru South' },
] as const;

const OPTIONS = [
  { label: 'Not Practised', value: 0 },
  { label: 'Rarely', value: 5 },
  { label: 'Sometimes', value: 10 },
  { label: 'Often', value: 15 },
  { label: 'Always', value: 20 },
] as const;

const QUESTIONS: { question: string; why: string }[] = [
  {
    question: 'Do you use cover crops or mulching to protect soil health?',
    why: 'Cover crops prevent erosion, fix nitrogen, and increase organic matter — all tracked by Sentinel-2 NDVI trends.',
  },
  {
    question: 'Do you apply compost or organic fertiliser to your land?',
    why: 'Organic inputs improve soil biology and reduce chemical runoff, supporting certification standards like EU Organic and Rainforest Alliance.',
  },
  {
    question: 'Have you reduced or eliminated synthetic pesticide use?',
    why: 'Pesticide reduction is a primary requirement for agroecological certification and protects surrounding biodiversity corridors.',
  },
  {
    question: 'Do you manage water through irrigation, conservation, or rainwater harvesting?',
    why: "Water efficiency is a core metric for climate-resilient farming and is required for EUDR compliance documentation.",
  },
  {
    question: 'Do you maintain tree cover or agroforestry on your farm?',
    why: "Tree cover is directly monitored via satellite canopy analysis. Agroforestry is the strongest positive signal for BioTrace's deforestation-free certification.",
  },
];

const STORAGE_KEY = 'biotrace_survey_responses';

const COOP_MAP: Record<string, string> = {
  'coop-1': 'kenyacoop-a',
  'coop-2': 'kenyacoop-b',
  'coop-3': 'kenyacoop-c',
};

function getStatus(score: number): { label: string; color: string; emoji: string } {
  if (score >= 70) return { label: 'Certifiable ✓', color: '#16a34a', emoji: '✅' };
  if (score >= 40) return { label: 'Progressing', color: '#F59E0B', emoji: '🟡' };
  return { label: 'Needs Improvement', color: '#EF4444', emoji: '🔴' };
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function SurveyPage() {
  const searchParams = useSearchParams();
  const coopParam = searchParams.get('coop');
  const farmParam = searchParams.get('farm');

  const [farmerName, setFarmerName] = useState('');
  const [cooperativeId, setCooperativeId] = useState('');
  const [surveyMonth, setSurveyMonth] = useState(getCurrentMonth());
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1, -1, -1]);
  const [expandedWhy, setExpandedWhy] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    farmerName: string;
    practiceScore: number;
    apsEstimate: number;
    cooperativeId: string;
    surveyMonth: string;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Pre-fill from URL params
  useEffect(() => {
    if (coopParam && COOP_OPTIONS.some((o) => o.value === coopParam)) {
      setCooperativeId(coopParam);
    }
  }, [coopParam]);

  useEffect(() => {
    if (!farmParam) return;
    const farms = farmsData as { id: string; farmerName: string; cooperativeId: string }[];
    const farm = farms.find((f) => f.id === farmParam);
    if (farm) {
      setFarmerName(farm.farmerName);
      setCooperativeId(COOP_MAP[farm.cooperativeId] ?? farm.cooperativeId);
    }
  }, [farmParam]);

  const practiceScore = answers.every((a) => a >= 0)
    ? answers.reduce((s, a) => s + a, 0)
    : 0;
  const questionsRemaining = answers.filter((a) => a < 0).length;
  const canSubmit =
    farmerName.trim() &&
    cooperativeId &&
    answers.every((a) => a >= 0);
  const status = getStatus(practiceScore);

  const setAnswer = useCallback((qIdx: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = value;
      return next;
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const ndvi_mock = 0.45 + Math.random() * 0.3;
    const aps = Math.round(ndvi_mock * 100 * 0.4 + practiceScore * 0.4);
    const apsClamped = Math.min(100, Math.max(0, aps));
    const response = {
      id: 'survey-' + Date.now(),
      farmerName: farmerName.trim(),
      cooperativeId,
      surveyMonth,
      answers: { q1: answers[0], q2: answers[1], q3: answers[2], q4: answers[3], q5: answers[4] },
      practiceScore,
      apsEstimate: apsClamped,
      submittedAt: new Date().toISOString(),
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, response]));
    } catch {}
    setResult({
      farmerName: farmerName.trim(),
      practiceScore,
      apsEstimate: apsClamped,
      cooperativeId,
      surveyMonth,
    });
    setSubmitted(true);
  }

  function copyShareLink() {
    const coop = result?.cooperativeId ?? cooperativeId;
    const url = typeof window !== 'undefined' ? window.location.origin + '/survey?coop=' + coop : '';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    }
  }

  function resetSurvey() {
    setSubmitted(false);
    setResult(null);
    setFarmerName('');
    setCooperativeId(coopParam || '');
    setSurveyMonth(getCurrentMonth());
    setAnswers([-1, -1, -1, -1, -1]);
  }

  // Results card
  if (submitted && result) {
    const statusInfo = getStatus(result.practiceScore);
    const apsStatus = getStatus(result.apsEstimate);
    const pointsTo70 = Math.max(0, 70 - result.practiceScore);
    const tips: string[] = [];
    if (answers[0] < 15) tips.push('Adding cover crops could add up to 15 points to your score.');
    if (answers[4] < 15) tips.push('Planting 5 trees per hectare qualifies as agroforestry.');
    if (answers[2] < 10) tips.push('Reducing pesticides by 50% satisfies the BioTrace threshold.');
    const topTips = tips.slice(0, 3);

    return (
      <div className="mx-auto max-w-md px-4 pt-8 pb-24">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900">
            🌿 Survey Complete — Thank You, {result.farmerName}!
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">Practice Score</p>
              <p className="text-2xl font-bold" style={{ color: statusInfo.color }}>
                {result.practiceScore} / 100
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-500">APS Estimate</p>
              <p className="text-2xl font-bold" style={{ color: apsStatus.color }}>
                {result.apsEstimate} / 100
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 pt-6">
            {result.practiceScore >= 70 ? (
              <p className="text-sm font-medium text-emerald-700">
                ✅ CERTIFIABLE — You qualify for a BioTrace digital certificate!
              </p>
            ) : result.practiceScore >= 40 ? (
              <p className="text-sm font-medium text-amber-700">
                🟡 PROGRESSING — {pointsTo70} more points needed to reach certification threshold of 70
              </p>
            ) : (
              <p className="text-sm font-medium text-red-700">
                🔴 NEEDS IMPROVEMENT — {pointsTo70} more points needed
              </p>
            )}
          </div>
          {topTips.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="mb-2 text-sm font-semibold text-gray-700">IMPROVEMENT TIPS</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                {topTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetSurvey}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Submit Another Survey
            </button>
            <button
              type="button"
              onClick={copyShareLink}
              className="rounded-lg bg-[#1A7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15635A] transition-colors"
            >
              {linkCopied ? 'Link copied!' : 'Share Survey Link'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] px-4 pb-32 pt-0 md:pb-8">
      {/* Header */}
      <header
        className="-mx-4 mb-8 px-4 py-6 text-white sm:-mx-6 sm:px-6"
        style={{ backgroundColor: '#1A7A6E' }}
      >
        <h1 className="text-xl font-bold sm:text-2xl">
          🌿 BioTrace — Agroecological Practice Survey
        </h1>
        <p className="mt-2 text-sm text-white/95">
          Complete this survey to update your farm&apos;s certification score
        </p>
        <p className="mt-1 text-xs text-white/80">[Estimated time: 3 minutes]</p>
      </header>

      <form onSubmit={handleSubmit}>
        {/* Step 1 */}
        <section className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="border-b border-gray-100 pb-2 text-base font-semibold text-[#1A7A6E]">
            Step 1 — Farm Identification
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="survey-farmer" className="mb-1 block text-sm font-medium text-gray-700">
                Farmer Name *
              </label>
              <input
                id="survey-farmer"
                type="text"
                required
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
              />
            </div>
            <div>
              <label htmlFor="survey-coop" className="mb-1 block text-sm font-medium text-gray-700">
                Cooperative *
              </label>
              <select
                id="survey-coop"
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
              <label htmlFor="survey-month" className="mb-1 block text-sm font-medium text-gray-700">
                Survey Month
              </label>
              <input
                id="survey-month"
                type="month"
                value={surveyMonth}
                onChange={(e) => setSurveyMonth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
              />
            </div>
          </div>
        </section>

        {/* Step 2 — Questions */}
        <section className="mb-8">
          <h2 className="mb-4 border-b border-gray-100 pb-2 text-base font-semibold text-[#1A7A6E]">
            Step 2 — Practice Questions
          </h2>
          <div className="space-y-4">
            {QUESTIONS.map((q, qIdx) => (
              <div
                key={qIdx}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-[#1A7A6E]/30"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Q{qIdx + 1} of 5</span>
                  <span className="text-xs text-gray-500">[0–20 pts]</span>
                </div>
                <p className="mb-3 text-sm font-medium text-gray-900">{q.question}</p>
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setExpandedWhy(expandedWhy === qIdx ? null : qIdx)}
                    className="flex items-center gap-1 text-xs text-[#1A7A6E] hover:underline"
                  >
                    Why it matters
                    <span className={`inline-block transition-transform ${expandedWhy === qIdx ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {expandedWhy === qIdx && (
                    <p className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-600">{q.why}</p>
                  )}
                </div>
                <div className="space-y-0 overflow-hidden rounded-lg border border-gray-100">
                  {OPTIONS.map((opt) => {
                    const selected = answers[qIdx] === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0 transition-colors ${
                          selected
                            ? 'border-l-4 border-[#1A7A6E] bg-[#f0faf9]'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${qIdx}`}
                          value={opt.value}
                          checked={selected}
                          onChange={() => setAnswer(qIdx, opt.value)}
                          className="h-4 w-4 border-gray-300 text-[#1A7A6E] focus:ring-[#1A7A6E]"
                        />
                        <span className="text-sm text-gray-700">
                          {opt.label} ({opt.value} pts)
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step 3 — Live score preview (sticky on mobile) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-lg md:static md:z-auto md:mb-6 md:rounded-xl md:border md:border-gray-100 md:shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Your Practice Score</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#1A7A6E] transition-all duration-300"
                style={{ width: `${practiceScore}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-900">{practiceScore} / 100</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Status: {status.label} {status.emoji}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {questionsRemaining > 0
              ? `Answer all 5 questions to submit · ${questionsRemaining} question${questionsRemaining === 1 ? '' : 's'} remaining`
              : 'All questions answered — you can submit'}
          </p>
        </div>

        {/* Step 4 — Submit */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-[#1A7A6E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#15635A] disabled:opacity-50 transition-colors"
          >
            Submit Survey & Calculate Score →
          </button>
        </div>
      </form>
    </div>
  );
}
