'use client';

import Link from 'next/link';
import GlobalNav from '@/components/GlobalNav';
import { LeafIcon, TrendingDownIcon, SearchIcon, SatelliteIcon, ClipboardIcon, TrophyIcon, CpuIcon, ChartIcon } from '@/components/Icons';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNav activePage="landing" />

      {/* Section 1 — HERO */}
      <section className="bg-[#0D3D35] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <img src="/flahtik-logo.png" alt="FLAHTIK" className="h-14 w-auto" />
            <span className="text-white/30">|</span>
            <span className="rounded bg-white/10 px-3 py-1 text-sm font-semibold text-[#0DF5B4]">
              Mago
            </span>
          </div>
          <h1 className="text-center font-bold text-white sm:text-left text-5xl md:text-6xl">
            Satellite-Verified Agroecology Certification
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-xl text-white/80 sm:mx-0">
            Mago connects smallholder cooperatives to ESG buyers through AI-powered satellite
            scoring, EUDR compliance, and QR-verified digital certificates.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 sm:justify-start">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#0DF5B4] px-6 py-3 font-bold text-[#0D3D35] transition-colors hover:bg-[#0DF5B4]/90"
            >
              Explore Platform →
            </Link>
            <a
              href="https://www.flahtik.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/40 px-6 py-3 text-white transition-colors hover:bg-white/10"
            >
              Learn About FLAHTIK →
            </a>
          </div>
        </div>
      </section>

      {/* Section 2 — PROBLEM */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-[#0D3D35]">
            The Challenge Facing Smallholder Farmers
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0DF5B4]/20 text-[#2D5A2E]">
                <LeafIcon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">No Verification</h3>
              <p className="mt-2 text-sm text-gray-600">
                Farmers practicing agroecology have no way to prove it to buyers.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0DF5B4]/20 text-[#2D5A2E]">
                <TrendingDownIcon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Price Penalty</h3>
              <p className="mt-2 text-sm text-gray-600">
                Without certification, sustainable farmers earn commodity prices.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0DF5B4]/20 text-[#2D5A2E]">
                <SearchIcon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Buyer Blind Spots</h3>
              <p className="mt-2 text-sm text-gray-600">
                ESG-conscious buyers can&apos;t identify verified sustainable sources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — SOLUTION */}
      <section className="bg-[#F8FAFB] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-[#0D3D35]">
            How Mago Works
          </h2>
          <div className="mt-12 flex flex-col gap-8 md:flex-row md:gap-4">
            <div className="flex flex-1 flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0DF5B4] text-lg font-bold text-[#0D3D35]">
                1
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">Satellite Analysis</h3>
              <p className="mt-1 text-sm text-gray-600">
                Sentinel-2 imagery scores farm parcels on 6 vegetation indices
              </p>
            </div>
            <div className="flex flex-1 flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0DF5B4] text-lg font-bold text-[#0D3D35]">
                2
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">Practice Scoring</h3>
              <p className="mt-1 text-sm text-gray-600">
                AI generates Agroecological Practice Score (APS) 0–100
              </p>
            </div>
            <div className="flex flex-1 flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0DF5B4] text-lg font-bold text-[#0D3D35]">
                3
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">Digital Certificate</h3>
              <p className="mt-1 text-sm text-gray-600">
                QR-coded certificate with traceability hash
              </p>
            </div>
            <div className="flex flex-1 flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0DF5B4] text-lg font-bold text-[#0D3D35]">
                4
              </span>
              <h3 className="mt-3 font-semibold text-gray-900">Buyer Connection</h3>
              <p className="mt-1 text-sm text-gray-600">
                Verified cooperatives listed in searchable ESG buyer portal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — METRICS */}
      <section className="bg-[#0D3D35] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 text-center md:grid-cols-3">
            <div>
              <p className="text-5xl font-bold text-[#0DF5B4]">10m</p>
              <p className="mt-2 text-sm uppercase tracking-wide text-white/70">
                Sentinel-2 satellite resolution
              </p>
            </div>
            <div>
              <p className="text-5xl font-bold text-[#0DF5B4]">$7–10</p>
              <p className="mt-2 text-sm uppercase tracking-wide text-white/70">
                Per hectare per year
              </p>
            </div>
            <div>
              <p className="text-5xl font-bold text-[#0DF5B4]">EUDR Ready</p>
              <p className="mt-2 text-sm uppercase tracking-wide text-white/70">
                EU Deforestation Regulation compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — PLATFORM FEATURES */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-[#0D3D35]">
            Platform Capabilities
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-[#2D5A2E]"><SatelliteIcon className="w-8 h-8" /></span>
              <h3 className="mt-2 font-semibold text-gray-900">Live Satellite Imagery</h3>
              <p className="mt-1 text-sm text-gray-600">
                Real-time NDVI, NDWI, EVI via Sentinel Hub
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-[#2D5A2E]"><ClipboardIcon className="w-8 h-8" /></span>
              <h3 className="mt-2 font-semibold text-gray-900">EUDR Compliance</h3>
              <p className="mt-1 text-sm text-gray-600">
                Full deforestation risk assessment aligned with EU 2023/1115
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-[#2D5A2E]"><TrophyIcon className="w-8 h-8" /></span>
              <h3 className="mt-2 font-semibold text-gray-900">Digital Certificates</h3>
              <p className="mt-1 text-sm text-gray-600">
                QR-linked PDF certificates per cooperative
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-[#2D5A2E]"><SearchIcon className="w-8 h-8" /></span>
              <h3 className="mt-2 font-semibold text-gray-900">Buyer Portal</h3>
              <p className="mt-1 text-sm text-gray-600">Searchable ESG directory</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-[#2D5A2E]"><CpuIcon className="w-8 h-8" /></span>
              <h3 className="mt-2 font-semibold text-gray-900">AI Improvement Roadmap</h3>
              <p className="mt-1 text-sm text-gray-600">
                Auto improvement plans for sub-threshold farms
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <span className="text-[#2D5A2E]"><ChartIcon className="w-8 h-8" /></span>
              <h3 className="mt-2 font-semibold text-gray-900">Biomass Tracking</h3>
              <p className="mt-1 text-sm text-gray-600">
                Carbon sequestration monitoring via satellite
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — CO-BRAND PARTNERSHIP */}
      <section className="bg-[#F0F7FC] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <img src="/flahtik-logo.png" alt="FLAHTIK" className="mx-auto mb-6 h-20 w-auto" />
          <h2 className="text-2xl font-bold text-[#0D3D35]">A FLAHTIK Innovation</h2>
          <p className="mt-4 text-gray-700 leading-relaxed">
            Mago is developed by FLAHTIK, an agri-tech and agri-consultancy company based in
            Manouba, Tunisia. FLAHTIK builds digital infrastructure for sustainable agriculture
            across Africa and MENA.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            <a
              href="https://www.flahtik.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4A9BC4] underline hover:no-underline"
            >
              Visit flahtik.com →
            </a>
            <a
              href="https://www.facebook.com/FLAHTIK"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4A9BC4] underline hover:no-underline"
            >
              View on Facebook →
            </a>
          </div>
        </div>
      </section>

      {/* Section 7 — PILOT REGIONS */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-[#0D3D35]">Pilot Regions</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Kenya 🇰🇪
            </span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Tunisia 🇹🇳
            </span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Morocco 🇲🇦
            </span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Senegal 🇸🇳
            </span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Algeria 🇩🇿
            </span>
            <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Ivory Coast 🇨🇮
            </span>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500">
            Phase 1 pilot launching in East Africa — targeting 3 cooperatives, cereal, tea and
            coffee crops
          </p>
        </div>
      </section>

      {/* Section 8 — CTA FOOTER */}
      <section className="bg-[#0D3D35] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to certify your cooperative?
          </h2>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-xl bg-[#0DF5B4] px-8 py-4 text-lg font-bold text-[#0D3D35] transition-colors hover:bg-[#0DF5B4]/90"
          >
            Access Mago Platform →
          </Link>
          <p className="mt-6 text-sm text-white/60">
            Questions? Contact us at contact@flahtik.com
          </p>
          <div className="mt-8 border-t border-white/10 pt-4">
            <p className="text-xs text-white/40">
              © 2026 FLAHTIK · www.flahtik.com · contact@flahtik.com
            </p>
            <p className="mt-1 text-xs text-white/40 inline-flex items-center gap-1"><LeafIcon className="w-3.5 h-3.5" fill="currentColor" /> Mago is a FLAHTIK product</p>
          </div>
        </div>
      </section>
    </div>
  );
}
