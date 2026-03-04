'use client';

import { useMemo, useState, useEffect } from 'react';
import jsPDF from 'jspdf';

import cooperativesData from '@/data/cooperatives.json';
import farmsData from '@/data/farms.json';

type Cooperative = (typeof cooperativesData)[number];
type Farm = (typeof farmsData)[number];

const INQUIRY_STORAGE_KEY = 'biotrace_buyer_inquiries';

const PRODUCT_OPTIONS = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'cocoa', label: 'Cocoa' },
  { value: 'cashew', label: 'Cashew' },
  { value: 'cereals', label: 'Cereals' },
  { value: 'banana', label: 'Banana' },
  { value: 'other', label: 'Other' },
];

const VOLUME_OPTIONS = [
  { value: '< 1 tonne', label: '< 1 tonne' },
  { value: '1–10 tonnes', label: '1–10 tonnes' },
  { value: '10–50 tonnes', label: '10–50 tonnes' },
  { value: '50–500 tonnes', label: '50–500 tonnes' },
  { value: '500+ tonnes', label: '500+ tonnes' },
];

const PURPOSE_OPTIONS = [
  { value: 'EUDR compliance documentation', label: 'EUDR compliance documentation' },
  { value: 'ESG / sustainability reporting', label: 'ESG / sustainability reporting' },
  { value: 'Direct trade / premium sourcing', label: 'Direct trade / premium sourcing' },
  { value: 'Research or due diligence', label: 'Research or due diligence' },
  { value: 'Other', label: 'Other' },
];

function productValueFromCrop(crop: string): string {
  const lower = crop.toLowerCase();
  if (PRODUCT_OPTIONS.some((o) => o.value === lower)) return lower;
  return 'other';
}

function generateESGReport(coop: Cooperative, farms: Farm[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const coopFarms = farms.filter((f) => f.cooperativeId === coop.id);
  const avgAPS =
    coopFarms.length > 0
      ? Math.round(coopFarms.reduce((s, f) => s + f.apsScore, 0) / coopFarms.length)
      : 0;
  const certified = coopFarms.filter((f) => f.apsScore >= 70).length;
  const eudrCompliant = coopFarms.every((f) => !('deforestationRisk' in f && f.deforestationRisk));

  // Header bar
  doc.setFillColor(26, 122, 110);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BioTrace ESG Report', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Satellite-Verified Agroecological Performance', 14, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 150, 20);

  // Cooperative name
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(coop.name, 14, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${coop.country} · ${coop.crop} · ${coop.farmerCount} farmers`, 14, 50);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 55, 196, 55);

  // Key metrics row
  const metrics = [
    { label: 'APS Score', value: `${avgAPS}/100` },
    { label: 'Certified Farms', value: `${certified}/${coopFarms.length}` },
    { label: 'EUDR Status', value: eudrCompliant ? 'Compliant ✓' : 'At Risk ✗' },
    { label: 'Carbon Proxy', value: `~${(avgAPS * 0.12).toFixed(1)} tCO₂/ha/yr` },
  ];
  metrics.forEach((m, i) => {
    const x = 14 + i * 47;
    doc.setFillColor(245, 247, 246);
    doc.roundedRect(x, 60, 43, 22, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 122, 110);
    doc.text(m.value, x + 21.5, 70, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(m.label, x + 21.5, 77, { align: 'center' });
  });

  // Practice scores section — map label keys to farm fields
  const practiceKeyMap: Record<string, keyof Farm> = {
    soilHealth: 'soilScore',
    waterManagement: 'waterScore',
    biodiversity: 'biodiversityScore',
    deforestationScore: 'deforestationScore',
    carbonScore: 'carbonScore',
  };
  const practices = [
    { name: 'Soil Health', key: 'soilHealth' },
    { name: 'Water Management', key: 'waterManagement' },
    { name: 'Biodiversity', key: 'biodiversity' },
    { name: 'Deforestation-Free', key: 'deforestationScore' },
    { name: 'Carbon Proxy', key: 'carbonScore' },
  ];
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Agroecological Practice Scores', 14, 96);
  doc.line(14, 99, 196, 99);

  practices.forEach((p, i) => {
    const y = 108 + i * 14;
    const farmKey = practiceKeyMap[p.key];
    const avg =
      coopFarms.length > 0
        ? Math.round(
            coopFarms.reduce((s, f) => s + ((farmKey && (f[farmKey] as number)) ?? 0), 0) / coopFarms.length
          )
        : 0;
    const barWidth = (avg / 100) * 120;
    const color: [number, number, number] =
      avg >= 70 ? [22, 163, 74] : avg >= 40 ? [245, 158, 11] : [239, 68, 68];
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(p.name, 14, y + 5);
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(70, y, 120, 7, 1, 1, 'F');
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(70, y, barWidth, 7, 1, 1, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(`${avg}`, 195, y + 5.5, { align: 'right' });
  });

  // Satellite evidence note
  doc.setFillColor(240, 249, 247);
  doc.roundedRect(14, 185, 182, 18, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 122, 110);
  doc.text('🛰  Satellite Evidence', 18, 193);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(
    'Scores computed from Sentinel-2 imagery (10m resolution, 5-day revisit). NDVI, canopy',
    18,
    199
  );
  doc.text('cover, and land use classification verified across 6-month temporal baseline.', 18, 204);

  // Footer
  doc.setFillColor(26, 122, 110);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    'BioTrace · M4D Open Innovation Challenge 2026 · biotrace-mvp.vercel.app',
    105,
    291,
    { align: 'center' }
  );

  doc.save(`BioTrace_ESG_${coop.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
}

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
  const [inquiryTarget, setInquiryTarget] = useState<CooperativeWithMetrics | null>(null);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({});
  const [inquiryForm, setInquiryForm] = useState({
    buyerName: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    productInterest: '',
    annualVolume: '',
    purposes: [] as string[],
    message: '',
    acknowledgement: false,
  });
  const [inquiryTouched, setInquiryTouched] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = inquiryTarget ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [inquiryTarget]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(INQUIRY_STORAGE_KEY) : null;
      if (!raw) return;
      const inquiries = JSON.parse(raw) as { cooperativeId: string }[];
      const counts: Record<string, number> = {};
      inquiries.forEach((inq) => {
        counts[inq.cooperativeId] = (counts[inq.cooperativeId] || 0) + 1;
      });
      setInquiryCounts(counts);
    } catch {}
  }, [inquiryTarget, inquirySubmitted]);

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
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">{coop.name}</h2>
                      {inquiryCounts[coop.id] > 0 && (
                        <span className="rounded-full bg-[#1A7A6E] px-2 py-0.5 text-xs font-medium text-white">
                          {inquiryCounts[coop.id]} {inquiryCounts[coop.id] === 1 ? 'inquiry' : 'inquiries'}
                        </span>
                      )}
                    </div>
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
                          onClick={() => generateESGReport(coop, farms)}
                          className="flex items-center gap-2 rounded-lg bg-[#1A7A6E] px-4 py-2 text-sm font-medium text-white hover:bg-[#15635A] transition-colors"
                        >
                          ⬇ Download ESG Report (PDF)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInquiryTarget(coop);
                            setInquirySubmitted(false);
                            setInquiryTouched(false);
                            setInquiryForm((prev) => ({
                              ...prev,
                              productInterest: productValueFromCrop(coop.crop),
                            }));
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1A7A6E] px-4 py-2.5 text-sm font-semibold text-[#1A7A6E] hover:bg-[#f0faf9] transition-colors"
                        >
                          ✉ Contact This Cooperative
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

      {/* Inquiry modal */}
      {inquiryTarget && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setInquiryTarget(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setInquiryTarget(null);
                setInquirySubmitted(false);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>

            {inquirySubmitted ? (
              /* Success state */
              <div className="text-center">
                <p className="text-4xl" aria-hidden>✅</p>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Inquiry Sent Successfully</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {inquiryForm.company || 'Your company'}, your inquiry has been submitted to {inquiryTarget.name}.
                </p>
                <p className="mt-2 text-xs font-mono text-gray-500">
                  Reference ID: INQ-{String(Date.now()).slice(-6)}
                </p>
                <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left text-sm text-gray-600">
                  <p className="font-medium text-gray-700">What happens next:</p>
                  <ol className="mt-2 list-inside list-decimal space-y-1">
                    <li>Cooperative manager notified</li>
                    <li>Manager reviews your sourcing needs</li>
                    <li>Direct introduction within 48 hours</li>
                  </ol>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => generateESGReport(inquiryTarget, farms)}
                    className="rounded-lg bg-[#1A7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15635A] transition-colors"
                  >
                    Download ESG Report
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInquiryTarget(null);
                      setInquirySubmitted(false);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <>
                <h3 className="pr-8 text-lg font-bold text-gray-900">✉ Sourcing Inquiry</h3>
                <p className="mt-1 text-sm font-medium text-gray-600">
                  {inquiryTarget.name} · {inquiryTarget.country} · {inquiryTarget.crop}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Your inquiry will be forwarded to the cooperative manager. BioTrace does not share your contact
                  details without consent.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setInquiryTouched(true);
                    const valid =
                      inquiryForm.buyerName.trim() &&
                      inquiryForm.company.trim() &&
                      inquiryForm.email.trim() &&
                      inquiryForm.annualVolume &&
                      inquiryForm.purposes.length > 0 &&
                      inquiryForm.acknowledgement;
                    if (!valid) return;
                    setInquirySubmitting(true);
                    const inquiry = {
                      id: 'inquiry-' + Date.now(),
                      cooperativeId: inquiryTarget.id,
                      cooperativeName: inquiryTarget.name,
                      buyerName: inquiryForm.buyerName.trim(),
                      company: inquiryForm.company.trim(),
                      email: inquiryForm.email.trim(),
                      phone: inquiryForm.phone.trim() || undefined,
                      country: inquiryForm.country.trim(),
                      productInterest: inquiryForm.productInterest,
                      annualVolume: inquiryForm.annualVolume,
                      purposes: inquiryForm.purposes,
                      message: inquiryForm.message.trim() || undefined,
                      submittedAt: new Date().toISOString(),
                      status: 'pending',
                    };
                    try {
                      const raw = localStorage.getItem(INQUIRY_STORAGE_KEY);
                      const existing = raw ? JSON.parse(raw) : [];
                      localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify([...existing, inquiry]));
                      setInquirySubmitted(true);
                      const counts = { ...inquiryCounts };
                      counts[inquiryTarget.id] = (counts[inquiryTarget.id] || 0) + 1;
                      setInquiryCounts(counts);
                    } finally {
                      setInquirySubmitting(false);
                    }
                  }}
                  className="mt-6 space-y-6"
                >
                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Section 1 — Your Details
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.buyerName}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, buyerName: e.target.value }))}
                          className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[#1A7A6E] focus:border-transparent ${
                            inquiryTouched && !inquiryForm.buyerName.trim() ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {inquiryTouched && !inquiryForm.buyerName.trim() && (
                          <p className="mt-0.5 text-xs text-red-600">Required</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Company / Organization *</label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.company}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, company: e.target.value }))}
                          className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[#1A7A6E] focus:border-transparent ${
                            inquiryTouched && !inquiryForm.company.trim() ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {inquiryTouched && !inquiryForm.company.trim() && (
                          <p className="mt-0.5 text-xs text-red-600">Required</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={inquiryForm.email}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, email: e.target.value }))}
                          className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[#1A7A6E] focus:border-transparent ${
                            inquiryTouched && !inquiryForm.email.trim() ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {inquiryTouched && !inquiryForm.email.trim() && (
                          <p className="mt-0.5 text-xs text-red-600">Required</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number (optional)</label>
                        <input
                          type="text"
                          value={inquiryForm.phone}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+1 212 555 0100"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Country *</label>
                        <input
                          type="text"
                          required
                          value={inquiryForm.country}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, country: e.target.value }))}
                          placeholder="e.g. Netherlands, Germany, UAE"
                          className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[#1A7A6E] focus:border-transparent ${
                            inquiryTouched && !inquiryForm.country.trim() ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {inquiryTouched && !inquiryForm.country.trim() && (
                          <p className="mt-0.5 text-xs text-red-600">Required</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Section 2 — Sourcing Intent
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Product Interest *</label>
                        <select
                          required
                          value={inquiryForm.productInterest}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, productInterest: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
                        >
                          <option value="">Select</option>
                          {PRODUCT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Estimated Annual Volume *</label>
                        <select
                          required
                          value={inquiryForm.annualVolume}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, annualVolume: e.target.value }))}
                          className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-[#1A7A6E] focus:border-transparent ${
                            inquiryTouched && !inquiryForm.annualVolume ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select</option>
                          {VOLUME_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {inquiryTouched && !inquiryForm.annualVolume && (
                          <p className="mt-0.5 text-xs text-red-600">Required</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Purpose (check all that apply) *</label>
                        <div className="space-y-2">
                          {PURPOSE_OPTIONS.map((o) => (
                            <label key={o.value} className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={inquiryForm.purposes.includes(o.value)}
                                onChange={(e) => {
                                  setInquiryForm((f) => ({
                                    ...f,
                                    purposes: e.target.checked
                                      ? [...f.purposes, o.value]
                                      : f.purposes.filter((p) => p !== o.value),
                                  }));
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-[#1A7A6E] focus:ring-[#1A7A6E] accent-[#1A7A6E]"
                              />
                              <span className="text-sm text-gray-700">{o.label}</span>
                            </label>
                          ))}
                        </div>
                        {inquiryTouched && inquiryForm.purposes.length === 0 && (
                          <p className="mt-0.5 text-xs text-red-600">Select at least one</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Message (optional)</label>
                        <textarea
                          value={inquiryForm.message}
                          onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
                          placeholder="Tell the cooperative about your sourcing requirements, certifications you need, or timeline..."
                          rows={4}
                          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-[#1A7A6E]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Section 3 — Compliance Acknowledgement
                    </p>
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={inquiryForm.acknowledgement}
                        onChange={(e) => setInquiryForm((f) => ({ ...f, acknowledgement: e.target.checked }))}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1A7A6E] accent-[#1A7A6E]"
                      />
                      <span className="text-sm text-gray-700">
                        I confirm I am a legitimate buyer or researcher. I agree that BioTrace may share this inquiry
                        with the cooperative manager.
                      </span>
                    </label>
                    {inquiryTouched && !inquiryForm.acknowledgement && (
                      <p className="mt-0.5 text-xs text-red-600">Required to submit</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="w-full rounded-lg bg-[#1A7A6E] py-3 text-sm font-semibold text-white hover:bg-[#15635A] disabled:opacity-50 transition-colors"
                  >
                    {inquirySubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
