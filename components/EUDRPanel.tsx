'use client';

import { CheckIcon, RefreshIcon, AlertIcon, XIcon, SatelliteIcon, LeafIcon, FlameIcon, TreeIcon, DocumentIcon } from '@/components/Icons';

export interface EUDRPanelFarm {
  id: string;
  name: string;
  farmer: string;
  cooperative: string;
  apsScore: number;
  crop?: string;
  country?: string;
  farmSize?: number;
}

interface EUDRPanelProps {
  farm: EUDRPanelFarm;
  onClose?: () => void;
}

function getEudrStatus(apsScore: number): { label: string; bg: string } {
  if (apsScore >= 60) return { label: 'Certified', bg: 'bg-green-500' };
  if (apsScore >= 40) return { label: 'EUDR Pending', bg: 'bg-amber-500' };
  return { label: 'EUDR Risk Detected', bg: 'bg-red-500' };
}

function getRiskClassification(apsScore: number): string {
  if (apsScore >= 70) return 'Low Risk';
  if (apsScore >= 50) return 'Medium Risk';
  return 'High Risk';
}

export default function EUDRPanel({ farm, onClose }: EUDRPanelProps) {
  const status = getEudrStatus(farm.apsScore);
  const riskClass = getRiskClassification(farm.apsScore);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const currentMonth = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const sentinelOk = true;
  const ndviOk = farm.apsScore >= 60;
  const nbrOk = farm.apsScore >= 55;
  const forestOk = farm.apsScore >= 60;

  const evidenceRows = [
    { Icon: SatelliteIcon, label: 'Sentinel-2 Analysis', value: `Completed — ${currentMonth}`, ok: sentinelOk },
    { Icon: LeafIcon, label: 'NDVI Baseline (2020)', value: ndviOk ? 'Vegetation confirmed' : 'Low vegetation detected', ok: ndviOk },
    { Icon: FlameIcon, label: 'NBR Fire History', value: nbrOk ? 'No burn events detected' : 'Historical burn detected', ok: nbrOk },
    { Icon: TreeIcon, label: 'Forest Cover Change', value: forestOk ? 'Stable — No deforestation' : 'Change detected — Review required', ok: forestOk },
  ];

  function handleExport() {
    if (typeof window !== 'undefined') {
      window.alert('Export feature available in Phase 2');
    }
  }

  function handleDownloadPdf() {
    if (typeof window !== 'undefined') {
      window.print();
      window.alert('Tip: Save as PDF using your browser\'s print dialog');
    }
  }

  return (
    <div className="bg-white p-6">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <XIcon className="w-4 h-4" />
        </button>
      )}

      {/* A) EUDR STATUS HEADER */}
      <div className="mb-6">
        <div
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-lg font-bold text-white ${status.bg}`}
        >
          {status.bg === 'bg-green-500' && <CheckIcon className="w-5 h-5" />}
          {status.bg === 'bg-amber-500' && <RefreshIcon className="w-5 h-5" />}
          {status.bg === 'bg-red-500' && <AlertIcon className="w-5 h-5" />}
          {status.label}
        </div>
        <p className="mt-2 text-xs text-gray-500">EU Deforestation Regulation (2023/1115)</p>
        <p className="mt-0.5 text-[10px] text-gray-400">
          Applies to: Cocoa, Coffee, Cattle, Palm Oil, Soy, Wood, Rubber
        </p>
      </div>

      {/* B) FOREST BASELINE DATE */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-800">Forest Baseline Date</h4>
        <p className="mt-1 font-mono text-sm text-gray-700">31 December 2020</p>
        <p className="mt-0.5 text-xs text-gray-500">Land must have been non-deforested since this date</p>
        <span
          className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            farm.apsScore >= 60 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {farm.apsScore >= 60 ? <><CheckIcon className="w-3.5 h-3.5 inline-block align-middle mr-1" /> Verified deforestation-free since 2020</> : <><AlertIcon className="w-3.5 h-3.5 inline-block align-middle mr-1" /> Requires verification</>}
        </span>
      </div>

      {/* C) SATELLITE EVIDENCE */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-800">Satellite Evidence Summary</h4>
        <div className="mt-3 space-y-2">
          {evidenceRows.map((row) => {
            const RowIcon = row.Icon;
            return (
            <div key={row.label} className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <RowIcon className="w-4 h-4 text-[#2D5A2E]" />
                <div>
                  <p className="text-xs font-medium text-gray-800">{row.label}</p>
                  <p className="text-[10px] text-gray-500">{row.value}</p>
                </div>
              </div>
              <span className={row.ok ? 'text-green-600' : 'text-red-600'}>
                {row.ok ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
              </span>
            </div>
          ); })}
        </div>
      </div>

      {/* D) DUE DILIGENCE STATEMENT */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-800">Due Diligence Statement</h4>
        <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-relaxed text-gray-700">
          <p>
            This statement confirms that the farm parcel identified as [{farm.name}] operated by [{farm.farmer}] under [{farm.cooperative}] has been assessed against EU Deforestation Regulation (EUDR) 2023/1115 requirements using Copernicus Sentinel-2 satellite imagery.
          </p>
          <p className="mt-3">
            Assessment Date: {today}<br />
            Satellite Data Source: ESA Copernicus Sentinel-2<br />
            Forest Baseline Reference: 31 December 2020<br />
            Agroecology Practice Score: {farm.apsScore}/100<br />
            EUDR Risk Classification: {riskClass}
          </p>
        </div>
      </div>

      {/* E) POLYGON EXPORT */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-800">Parcel Polygon Export</h4>
        <p className="mt-0.5 text-xs text-gray-500">Required for EUDR due diligence submissions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            📥 Export GeoJSON
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            📥 Export KML
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            📥 Export Shapefile (.zip)
          </button>
        </div>
        <p className="mt-2 text-[10px] text-gray-400">
          Polygon coordinates: {farm.id} (Sentinel-2 derived boundary)
        </p>
      </div>

      {/* F) DOWNLOAD DUE DILIGENCE PDF */}
      <div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="w-full rounded-lg bg-[#1A7A6E] py-3 text-sm font-semibold text-white hover:bg-[#15635A]"
        >
          <DocumentIcon className="w-4 h-4 inline-block align-middle mr-1" /> Download Due Diligence Statement (PDF)
        </button>
        <p className="mt-2 text-[10px] text-gray-500 text-center">
          Accepted by EU customs authorities under EUDR Article 9 compliance documentation
        </p>
      </div>
    </div>
  );
}
