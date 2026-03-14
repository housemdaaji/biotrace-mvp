'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import GlobalNav from '@/components/GlobalNav';
import MagoScoreCard, { type MetricItem } from '@/components/MagoScoreCard';
import {
  SatelliteIcon,
  CheckIcon,
  AlertIcon,
  XIcon,
  MedalIcon,
  ClipboardIcon,
  MapIcon,
  RefreshIcon,
  CalendarIcon,
  BookIcon,
  PhoneIcon,
  TreeIcon,
  WindIcon,
  DropletIcon,
  MetricIcon,
} from '@/components/Icons';
import type { MetricIconKey } from '@/components/Icons';

const COUNTRIES = ['Kenya', 'Tunisia', 'Morocco', 'Ethiopia', 'Rwanda', 'Senegal', 'Uganda', 'Other'] as const;
const CROPS = ['Coffee', 'Tea', 'Cocoa', 'Olive', 'Cereals', 'Banana', 'Potato', 'Other'] as const;

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

interface FormData {
  fullName: string;
  cooperativeName: string;
  country: string;
  farmSize: string;
  primaryCrop: string;
  phone: string;
  gpsCoordinates: string;
}

const ASSESSMENT_ITEMS = [
  'Checking land use history (2020–2025)',
  'Analyzing vegetation coverage (NDVI)',
  'Verifying deforestation-free status (NBR)',
  'Calculating soil health indicators (BSI)',
];

function computeScore(form: FormData): number {
  let baseScore = 50;
  const farmSizeNum = parseFloat(form.farmSize) || 0;
  if (farmSizeNum < 5) baseScore += 10;
  if (['Coffee', 'Tea', 'Cocoa'].includes(form.primaryCrop)) baseScore += 15;
  if (['Kenya', 'Ethiopia', 'Rwanda'].includes(form.country)) baseScore += 10;
  if (form.gpsCoordinates.trim()) baseScore += 5;
  baseScore += Math.floor(Math.random() * 10);
  return Math.min(95, baseScore);
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function buildMetricsFromScore(finalScore: number): MetricItem[] {
  const apsScore = finalScore;
  const biodiversity = Math.min(100, apsScore + 8);
  const carbon = Math.max(0, Math.round(100 - apsScore + 12));
  const water = Math.max(0, Math.round(100 - apsScore + 5));
  return [
    { iconKey: 'deforestation', name: 'Deforestation-Free Compliance', score: apsScore, unit: '/100', certified: getDeforestationStatus(apsScore) === 'green' },
    { iconKey: 'agroecology', name: 'Agroecology Practice Score', score: apsScore, unit: '/100', certified: getApsStatus(apsScore) === 'green' },
    { iconKey: 'biodiversity', name: 'Biodiversity Score', score: biodiversity, unit: '/100', certified: getBiodiversityStatus(biodiversity) === 'green' },
    { iconKey: 'carbon', name: 'Carbon Footprint', score: carbon, unit: 'tCO₂/ha', certified: getCarbonFootprintStatus(carbon) === 'green' },
    { iconKey: 'water', name: 'Water Footprint', score: water, unit: 'm³/ha', certified: getWaterFootprintStatus(water) === 'green' },
  ];
}

export default function SurveyPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    cooperativeName: '',
    country: '',
    farmSize: '',
    primaryCrop: '',
    phone: '',
    gpsCoordinates: '',
  });
  const [assessmentProgress, setAssessmentProgress] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<'certificate' | 'roadmap' | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [certId] = useState(() => 'BT-' + randomId());

  const updateForm = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Step 2: animate assessment checks
  useEffect(() => {
    if (currentStep !== 2) return;
    if (assessmentProgress >= 4) return;
    const t = setTimeout(() => setAssessmentProgress((p) => p + 1), 800);
    return () => clearTimeout(t);
  }, [currentStep, assessmentProgress]);

  // Step 2: after all checks + message, auto-advance to Step 3
  useEffect(() => {
    if (currentStep !== 2 || assessmentProgress < 4) return;
    const t = setTimeout(() => {
      const score = computeScore(formData);
      setFinalScore(score);
      setOutcome(score >= 60 ? 'certificate' : 'roadmap');
      setCurrentStep(3);
    }, 1000);
    return () => clearTimeout(t);
  }, [currentStep, assessmentProgress, formData]);

  // Step 3: count-up score animation
  useEffect(() => {
    if (currentStep !== 3 || finalScore == null) return;
    const target = finalScore;
    const step = Math.max(1, Math.ceil(target / 30));
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplayScore(current);
      if (current >= target) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [currentStep, finalScore]);

  const goNext = () => {
    if (currentStep === 1) {
      const { fullName, cooperativeName, country, farmSize, primaryCrop } = formData;
      if (!fullName.trim() || !cooperativeName.trim() || !country || !primaryCrop) return;
      const size = parseFloat(farmSize);
      if (Number.isNaN(size) || size < 0.1) return;
      setAssessmentProgress(0);
      setCurrentStep(2);
    }
  };

  const resetToStep1 = () => {
    setCurrentStep(1);
    setFormData({
      fullName: '',
      cooperativeName: '',
      country: '',
      farmSize: '',
      primaryCrop: '',
      phone: '',
      gpsCoordinates: '',
    });
    setAssessmentProgress(0);
    setFinalScore(null);
    setOutcome(null);
    setDisplayScore(0);
  };

  const stepLabels = ['Farmer Registration', 'Satellite Eligibility Assessment', 'Score & Evaluation', outcome === 'certificate' ? 'Certificate' : 'Improvement Roadmap'];
  const activeLabel = currentStep <= 4 ? stepLabels[currentStep - 1] : stepLabels[3];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <GlobalNav activePage="survey" />
      <div className="w-full max-w-lg mx-auto py-8 px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                className={`inline-flex h-2 w-2 rounded-full ${
                  s < currentStep ? 'bg-[#1A7A6E]' : s === currentStep ? 'bg-[#1A7A6E]' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Step 1</span>
            <span>Step 2</span>
            <span>Step 3</span>
            <span>Step 4</span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Step {currentStep} of 4 — {activeLabel}
          </p>
        </div>

        {/* Step 1 — Farmer Registration */}
        {currentStep === 1 && (
          <div className="rounded-xl border border-gray-700 bg-white shadow-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Farmer Registration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => updateForm('fullName', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cooperative Name *</label>
                <input
                  type="text"
                  required
                  value={formData.cooperativeName}
                  onChange={(e) => updateForm('cooperativeName', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country *</label>
                <select
                  required
                  value={formData.country}
                  onChange={(e) => updateForm('country', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Farm Size (hectares) *</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  required
                  value={formData.farmSize}
                  onChange={(e) => updateForm('farmSize', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Primary Crop *</label>
                <select
                  required
                  value={formData.primaryCrop}
                  onChange={(e) => updateForm('primaryCrop', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
                >
                  <option value="">Select crop</option>
                  {CROPS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number (optional)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">GPS Coordinates (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. -0.10, 37.65"
                  value={formData.gpsCoordinates}
                  onChange={(e) => updateForm('gpsCoordinates', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A7A6E] focus:border-[#1A7A6E]"
                />
              </div>
              <button
                type="button"
                onClick={goNext}
                className="w-full rounded-lg bg-[#1A7A6E] text-white font-semibold py-3 text-sm hover:bg-[#15635A] transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Satellite Eligibility Assessment */}
        {currentStep === 2 && (
          <div className="rounded-xl border border-gray-700 bg-white shadow-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1 inline-flex items-center gap-2"><SatelliteIcon className="w-5 h-5" /> Running Satellite Assessment</h2>
            <p className="text-xs text-gray-500 mb-6">Analyzing Sentinel-2 imagery for your farm area</p>
            <div className="space-y-3">
              {ASSESSMENT_ITEMS.map((label, i) => (
                <div key={label} className="flex items-center gap-3 py-2">
                  {assessmentProgress > i ? (
                    <span className="text-[#1A7A6E]"><CheckIcon className="w-5 h-5" /></span>
                  ) : (
                    <span className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-[#1A7A6E] border-t-transparent" />
                  )}
                  <span className={assessmentProgress > i ? 'text-sm text-gray-700' : 'text-sm text-gray-400'}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            {assessmentProgress >= 4 && (
              <p className="mt-6 text-sm font-medium text-[#1A7A6E] text-center">
                Assessment Complete — Generating your score...
              </p>
            )}
          </div>
        )}

        {/* Step 3 — Score & Evaluation */}
        {currentStep === 3 && finalScore != null && (
          <div className="rounded-xl border border-gray-700 bg-white shadow-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Score & Evaluation</h2>
            <div className="text-center mb-6">
              <span className="text-5xl font-bold text-[#1A7A6E]">{displayScore}</span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            {(() => {
              const apsScore = finalScore;
              const biodiversity = Math.min(100, apsScore + 8);
              const carbon = Math.max(0, Math.round(100 - apsScore + 12));
              const water = Math.max(0, Math.round(100 - apsScore + 5));
              const statuses: ComplianceStatus[] = [
                getDeforestationStatus(apsScore),
                getApsStatus(apsScore),
                getBiodiversityStatus(biodiversity),
                getCarbonFootprintStatus(carbon),
                getWaterFootprintStatus(water),
              ];
              const hasRed = statuses.some((s) => s === 'red');
              const allGreen = statuses.every((s) => s === 'green');
              const rows: { iconKey: MetricIconKey; label: string; value?: string; status: ComplianceStatus }[] = [
                { iconKey: 'deforestation', label: 'Deforestation-Free Status', status: statuses[0] },
                { iconKey: 'agroecology', label: 'Agroecology Practice Score', value: `${apsScore}/100`, status: statuses[1] },
                { iconKey: 'biodiversity', label: 'Biodiversity Score', value: `${biodiversity}/100`, status: statuses[2] },
                { iconKey: 'carbon', label: 'Carbon Footprint', value: `${carbon} tCO₂/ha`, status: statuses[3] },
                { iconKey: 'water', label: 'Water Footprint', value: `${water} m³/ha`, status: statuses[4] },
              ];
              return (
                <>
                  <div
                    className={`mb-4 rounded-lg border px-3 py-2 text-center ${
                      allGreen ? 'border-green-200 bg-green-50' : hasRed ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <p className={`text-xs font-bold inline-flex items-center gap-1 ${allGreen ? 'text-green-700' : hasRed ? 'text-red-700' : 'text-amber-700'}`}>
                      {allGreen ? <><CheckIcon className="w-3.5 h-3.5" /> Certified</> : hasRed ? <><AlertIcon className="w-3.5 h-3.5" /> EUDR Risk Detected</> : <><RefreshIcon className="w-3.5 h-3.5" /> EUDR Pending</>}
                    </p>
                    <p className={`text-[10px] ${allGreen ? 'text-green-600' : hasRed ? 'text-red-600' : 'text-amber-600'}`}>
                      {allGreen ? 'Deforestation-free verified · Ready for EU market' : hasRed ? 'Action required before certification' : 'Improvements needed · Re-assess in 90 days'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 mb-6">
                    {rows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-2 px-2 first:pt-2 last:pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#2D5A2E]"><MetricIcon iconKey={row.iconKey} className="w-4 h-4" /></span>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{row.label}</p>
                            {row.value != null && <p className="text-[10px] text-gray-400">{row.value}</p>}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            row.status === 'green' ? 'bg-green-100 text-green-700' : row.status === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {row.status === 'green' ? <><CheckIcon className="w-3 h-3" /> Compliant</> : row.status === 'yellow' ? <><AlertIcon className="w-3 h-3" /> Needs Attention</> : <><XIcon className="w-3 h-3" /> Non-Compliant</>}
                        </span>
                      </div>
                    ))}
                  </div>
                  {finalScore >= 60 ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 mb-4">
                      <p className="text-sm font-bold text-green-700 inline-flex items-center gap-1"><CheckIcon className="w-4 h-4" /> Congratulations! You qualify for certification</p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="mt-3 w-full rounded-lg bg-[#1A7A6E] text-white font-semibold py-2.5 text-sm hover:bg-[#15635A]"
                      >
                        Proceed to Certificate →
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 mb-4">
                      <p className="text-sm font-bold text-amber-700 inline-flex items-center gap-1"><ClipboardIcon className="w-4 h-4" /> You need improvements before certification</p>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="mt-3 w-full rounded-lg bg-amber-600 text-white font-semibold py-2.5 text-sm hover:bg-amber-700"
                      >
                        View Improvement Roadmap →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Step 4A — Certificate */}
        {currentStep === 4 && outcome === 'certificate' && finalScore != null && (
          <div className="space-y-6">
            <MagoScoreCard
              farmName={formData.cooperativeName ? `${formData.fullName} · ${formData.cooperativeName}` : formData.fullName}
              overallScore={finalScore}
              metrics={buildMetricsFromScore(finalScore)}
              onGenerateReport={() => typeof window !== 'undefined' && window.print()}
            />
            <div className="rounded-xl border-2 border-[#1A7A6E] bg-white shadow-xl overflow-hidden">
              <div className="bg-[#1A7A6E] text-white px-4 py-3 text-center">
                <p className="text-sm font-bold inline-flex items-center gap-2"><MedalIcon className="w-4 h-4" /> Mago Agroecology</p>
                <p className="text-sm font-bold">Certificate</p>
              </div>
              <div className="p-4 space-y-2 text-sm text-gray-800">
                <p><span className="text-gray-500">Issued to:</span> {formData.fullName}</p>
                <p><span className="text-gray-500">Cooperative:</span> {formData.cooperativeName}</p>
                <p><span className="text-gray-500">Country:</span> {formData.country}</p>
                <p><span className="text-gray-500">Crop:</span> {formData.primaryCrop}</p>
                <p><span className="text-gray-500">Farm Size:</span> {formData.farmSize} ha</p>
                <p><span className="text-gray-500">APS Score:</span> {finalScore}/100</p>
                <p><span className="text-gray-500">EUDR Status:</span> <span className="inline-flex items-center gap-1"><CheckIcon className="w-3.5 h-3.5" /> Compliant</span></p>
                <p><span className="text-gray-500">Certificate ID:</span> {certId}</p>
                <p><span className="text-gray-500">Issue Date:</span> {new Date().toLocaleDateString('en-GB')}</p>
                <p><span className="text-gray-500">Valid Until:</span> {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</p>
              </div>
              <div className="flex justify-center py-4">
                <div className="h-20 w-20 rounded bg-[#1A7A6E] flex items-center justify-center text-white text-xs font-bold">
                  QR
                </div>
              </div>
              <p className="text-[10px] text-gray-500 text-center pb-4">Powered by ESA Copernicus Sentinel-2 Satellite Data</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/map"
                className="rounded-lg border-2 border-[#1A7A6E] bg-white text-[#1A7A6E] font-semibold py-2.5 text-sm text-center hover:bg-[#f0faf9]"
              >
                <MapIcon className="w-4 h-4 inline-block align-middle mr-1" /> View on Map →
              </Link>
              <button
                type="button"
                onClick={() => typeof window !== 'undefined' && window.print()}
                className="w-full rounded-lg bg-[#1A7A6E] text-white font-semibold py-2.5 text-sm hover:bg-[#15635A]"
              >
                <ClipboardIcon className="w-4 h-4 inline-block align-middle mr-1" /> Download Certificate
              </button>
              <button
                type="button"
                onClick={resetToStep1}
                className="w-full rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold py-2.5 text-sm hover:bg-gray-50"
              >
                <RefreshIcon className="w-4 h-4 inline-block align-middle mr-1" /> Register Another Farm
              </button>
            </div>
          </div>
        )}

        {/* Step 4B — Improvement Roadmap */}
        {currentStep === 4 && outcome === 'roadmap' && finalScore != null && (
          <div className="space-y-6">
            <MagoScoreCard
              farmName={formData.cooperativeName ? `${formData.fullName} · ${formData.cooperativeName}` : formData.fullName}
              overallScore={finalScore}
              metrics={buildMetricsFromScore(finalScore)}
              onGenerateReport={() => {}}
            />
            <div className="rounded-xl border border-gray-700 bg-white shadow-xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1 inline-flex items-center gap-2"><ClipboardIcon className="w-5 h-5" /> Your Personalized Improvement Roadmap</h2>
              <p className="text-xs text-gray-500 mb-4">Complete these steps to qualify for Mago certification</p>
              <div className="space-y-3 mb-4">
                <div className="rounded-lg border-l-4 border-[#1A7A6E] bg-white p-3 border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> 90-day reassessment scheduled</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Complete the steps below and return for re-evaluation</p>
                </div>
                {(() => {
                  const apsScore = finalScore;
                  const carbon = Math.max(0, Math.round(100 - apsScore + 12));
                  const water = Math.max(0, Math.round(100 - apsScore + 5));
                  const deforestStatus = getDeforestationStatus(apsScore);
                  const carbonStatus = getCarbonFootprintStatus(carbon);
                  const waterStatus = getWaterFootprintStatus(water);
                  const items: { action: string; timeline: string; link?: string; Icon: typeof TreeIcon }[] = [];
                  if (deforestStatus !== 'green') {
                    items.push({ action: 'Plant cover crops or native trees on bare areas', timeline: '30 days', Icon: TreeIcon });
                  }
                  if (apsScore < 70) {
                    items.push({ action: 'Complete Mago Agroecology Training Module', timeline: '14 days', link: 'Start Training →', Icon: BookIcon });
                  }
                  if (carbonStatus === 'red') {
                    items.push({ action: 'Reduce tillage and adopt composting practices', timeline: '60 days', Icon: WindIcon });
                  }
                  if (waterStatus === 'red') {
                    items.push({ action: 'Install drip irrigation or water retention systems', timeline: '45 days', Icon: DropletIcon });
                  }
                  items.push({ action: 'Schedule a call with a Mago Field Advisor', timeline: 'This week', link: 'Book Call →', Icon: PhoneIcon });
                  return items.map((item, i) => {
                    const ActionIcon = item.Icon;
                    return (
                    <div key={i} className="rounded-lg border-l-4 border-[#1A7A6E] bg-white p-3 border border-gray-100 shadow-sm">
                      <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-2"><ActionIcon className="w-4 h-4 text-[#2D5A2E]" /> {item.action}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{item.timeline}</span>
                        {item.link && (
                          <span className="text-xs font-semibold text-[#1A7A6E] hover:underline cursor-pointer">{item.link}</span>
                        )}
                      </div>
                    </div>
                  ); });
                })()}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetToStep1}
                  className="w-full rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold py-2.5 text-sm hover:bg-gray-50"
                >
                  <RefreshIcon className="w-4 h-4 inline-block align-middle mr-1" /> Start Over
                </button>
                <Link
                  href="/map"
                  className="w-full rounded-lg bg-[#1A7A6E] text-white font-semibold py-2.5 text-sm text-center hover:bg-[#15635A]"
                >
                  <MapIcon className="w-4 h-4 inline-block align-middle mr-1" /> View Map →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
