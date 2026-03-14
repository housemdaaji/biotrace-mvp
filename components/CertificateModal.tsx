'use client';

import React, { useState, useEffect } from 'react';
import { XIcon, CheckIcon, AlertIcon } from '@/components/Icons';

/** Deterministic 8-char hex from btoa(lat+lng+score) */
function certificateId(centerLat: number, centerLng: number, score: number): string {
  const raw = btoa(String(centerLat) + String(centerLng) + String(score));
  const hex = Array.from(raw.slice(0, 4))
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
  return `CERT-${hex}`;
}

/** Index status from mean value */
function indexStatus(indexId: string, mean: number): 'pass' | 'review' | 'fail' {
  switch (indexId) {
    case 'NDVI':
    case 'EVI':
    case 'NBR':
      if (mean >= 0.5) return 'pass';
      if (mean >= 0.25) return 'review';
      return 'fail';
    case 'NDWI':
      if (mean >= 0.2) return 'pass';
      if (mean >= -0.1) return 'review';
      return 'fail';
    case 'NDMI':
      if (mean >= 0.15) return 'pass';
      if (mean >= 0) return 'review';
      return 'fail';
    case 'BSI':
      if (mean <= 0.15) return 'pass';
      if (mean <= 0.4) return 'review';
      return 'fail';
    default:
      return mean >= 0.5 ? 'pass' : mean >= 0.25 ? 'review' : 'fail';
  }
}

export interface CertificateData {
  bbox: [number, number, number, number];
  score: number;
  mean: number;
  interpretation: string;
  eudrSignal: string;
  recommendations: string[];
  selectedIndex: string;
  selectedMonth: string;
  indexLabel: string;
  pilotRegion?: string;
  analysisDate?: string;
}

interface CertificateModalProps {
  open: boolean;
  onClose: () => void;
  data: CertificateData | null;
}

export default function CertificateModal({ open, onClose, data }: CertificateModalProps) {
  const [QRComponent, setQRComponent] = useState<React.ComponentType<{ value: string; size?: number; level?: string }> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !open) return;
    import('qrcode.react').then((mod) => setQRComponent(mod.QRCodeSVG as React.ComponentType<{ value: string; size?: number; level?: string }>));
  }, [open]);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const timestamp = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!data) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 print:hidden">
        <div className="rounded-xl bg-white p-6 shadow-xl">
          <p className="text-gray-600">No certificate data.</p>
          <button type="button" onClick={onClose} className="mt-4 text-mago-forest font-medium">
            Close
          </button>
        </div>
      </div>
    );
  }

  const [west, south, east, north] = data.bbox;
  const centerLat = (north + south) / 2;
  const centerLng = (east + west) / 2;
  const certId = certificateId(centerLat, centerLng, data.score);
  const status = indexStatus(data.selectedIndex, data.mean);
  const statusLabel = status === 'pass' ? 'Pass' : status === 'review' ? 'Review' : 'Fail';
  const eudrPositive = data.eudrSignal.toLowerCase().includes('positive') || !data.eudrSignal.toLowerCase().includes('loss');

  const verifyUrl = `https://mago.flahtik.com/verify?score=${data.score}&index=${encodeURIComponent(data.selectedIndex)}&lat=${centerLat}&lng=${centerLng}&month=${encodeURIComponent(data.selectedMonth)}`;

  const scoreColor =
    data.score >= 70 ? 'text-mago-forest' : data.score >= 45 ? 'text-mago-gold' : 'text-red-600';
  const scoreRingColor =
    data.score >= 70 ? '#2D5A2E' : data.score >= 45 ? '#BC9420' : '#dc2626';

  return (
    <>
      <div className="certificate-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div
          className="certificate-print-card max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            {/* Close + header */}
            <div className="flex items-start justify-between print:justify-center">
              <div className="print:flex print:flex-col print:items-center print:text-center">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{certId}</p>
                <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-mago-forest">
                  <span aria-hidden>🌱</span> Mago
                </h1>
                <p className="text-sm text-gray-600">Agroecology Certification Report</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="print:hidden -mt-1 -mr-1 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Farm / Area</h2>
              <p className="mt-1 font-mono text-sm text-gray-800">
                N {north.toFixed(4)} · S {south.toFixed(4)} · E {east.toFixed(4)} · W {west.toFixed(4)}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {data.pilotRegion ?? 'Meru North, Kenya'} · Sentinel-2 · {data.analysisDate ?? timestamp}
              </p>
            </div>

            {/* Score badge with conic-gradient ring */}
            <div className="mt-8 flex justify-center">
              <div
                className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white"
                style={{
                  background: `conic-gradient(${scoreRingColor} 0deg, ${scoreRingColor} ${(data.score / 100) * 360}deg, #e5e7eb ${(data.score / 100) * 360}deg)`,
                  padding: '4px',
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                  <span className={`text-2xl font-bold ${scoreColor}`}>{data.score}</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-xs font-medium text-gray-500">Agroecology Score</p>

            {/* Index summary table */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Index Summary</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">Index</th>
                    <th className="pb-2 font-medium">Mean</th>
                    <th className="pb-2 font-medium">Interpretation</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium text-gray-800">{data.indexLabel} ({data.selectedIndex})</td>
                    <td className="py-2 text-gray-700">{data.mean.toFixed(3)}</td>
                    <td className="py-2 text-gray-600">{data.interpretation}</td>
                    <td className="py-2 text-right">
                      {status === 'pass' && (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckIcon className="w-4 h-4" /> Pass
                        </span>
                      )}
                      {status === 'review' && (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertIcon className="w-4 h-4" /> Review
                        </span>
                      )}
                      {status === 'fail' && (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XIcon className="w-4 h-4" /> Fail
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* EUDR row */}
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${eudrPositive ? 'bg-green-500' : 'bg-amber-500'}`}
                aria-hidden
              />
              <p className="text-sm text-gray-700">
                <span className="font-medium">EUDR:</span> {data.eudrSignal}
              </p>
            </div>

            {/* Recommendations */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Recommendations</h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {data.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* QR code */}
            <div className="mt-8 flex flex-col items-center border-t border-gray-200 pt-6">
              {QRComponent && (
                <QRComponent value={verifyUrl} size={140} level="M" />
              )}
              <p className="mt-2 text-[10px] text-gray-500 text-center max-w-[180px]">
                Scan to verify: score, index, location, month
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
              <p>Verified by Mago · Flahtik LLC · Tunisia</p>
              <p className="mt-1">{timestamp}</p>
            </div>

            {/* Download PDF button */}
            <div className="mt-6 flex justify-center print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg bg-mago-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mago-leaf"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
