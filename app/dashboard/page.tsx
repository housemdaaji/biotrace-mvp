'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GlobalNav from '@/components/GlobalNav';
import MagoScoreCard from '@/components/MagoScoreCard';

export default function DashboardPage() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#demo') {
      setIsDemoMode(true);
      setDemoStep(0);
    }
  }, []);

  const demoSteps = [
    {
      title: "Welcome to Mago",
      text: "This platform certifies smallholder farms using satellite data. Let's take a quick tour.",
      cta: null,
      onClick: null,
    },
    {
      title: "🗺 Satellite Map",
      text: "View 18 farms across 3 Kenyan cooperatives. Each circle shows a farm's APS score in real time.",
      cta: "Open Map →",
      onClick: () => window.open('/map', '_blank'),
    },
    {
      title: "🌱 Register a Farm",
      text: "Walk through the 4-step farmer onboarding. Satellite assessment runs automatically.",
      cta: "Try Registration →",
      onClick: () => window.open('/survey', '_blank'),
    },
    {
      title: "📋 EUDR Compliance",
      text: "Generate due diligence statements accepted under EU Deforestation Regulation Article 9.",
      cta: "View EUDR Center →",
      onClick: () => window.open('/eudr', '_blank'),
    },
    {
      title: "🛒 Buyer Portal",
      text: "Buyers can filter and download compliance packages for verified cooperative suppliers.",
      cta: "Open Buyer Portal →",
      onClick: () => window.open('/buyers', '_blank'),
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GlobalNav activePage="dashboard" />

      {/* Hero Section */}
      <section className="bg-[#060A08] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl text-center md:text-left">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">🌱 Mago Platform</h1>
          <p className="mt-3 text-lg text-white/90 sm:text-xl">
            AI-Powered Agroecology Certification
          </p>
          <p className="mt-1 font-mono text-sm text-[#0DF5B4]">
            Powered by ESA Copernicus Sentinel-2
          </p>
          
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            {[
              '🌍 12 Cooperatives',
              '✅ 8 EUDR Compliant',
              '🛰 Sentinel-2 Live',
              '📋 Track 4 Agroecology'
            ].map((stat, i) => (
              <span
                key={i}
                className="rounded-full border border-[#1A7A6E] bg-[#1A7A6E]/30 px-4 py-1.5 text-sm font-medium"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          
          {/* Feature Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Card 1: Map */}
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-md border-t-4" style={{ borderTopColor: '#1A7A6E' }}>
              <span className="absolute right-4 top-4 rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-teal-800 uppercase">
                LIVE DATA
              </span>
              <div className="text-4xl">🗺</div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">Satellite Map</h3>
              <p className="mt-2 mb-6 flex-1 text-sm text-gray-600 leading-relaxed">
                Explore live Sentinel-2 satellite imagery, NDVI overlays, and certified farm parcels across your pilot region.
              </p>
              <Link
                href="/map"
                className="block w-full rounded-lg bg-[#1A7A6E] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#15635A]"
              >
                Open Map →
              </Link>
            </div>

            {/* Card 2: Survey / Farmer Registration */}
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-md border-t-4" style={{ borderTopColor: '#16a34a' }}>
              <span className="absolute right-4 top-4 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-green-800 uppercase">
                4 STEPS
              </span>
              <div className="text-4xl">🌱</div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">Farmer Registration</h3>
              <p className="mt-2 mb-6 flex-1 text-sm text-gray-600 leading-relaxed">
                Onboard new farmers through a 4-step satellite eligibility assessment and receive a digital agroecology certificate.
              </p>
              <Link
                href="/survey"
                className="block w-full rounded-lg bg-[#1A7A6E] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#15635A]"
              >
                Start Registration →
              </Link>
            </div>

            {/* Card 3: EUDR */}
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-md border-t-4" style={{ borderTopColor: '#2563eb' }}>
              <span className="absolute right-4 top-4 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                EUDR 2023/1115
              </span>
              <div className="text-4xl">📋</div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">EUDR Compliance Center</h3>
              <p className="mt-2 mb-6 flex-1 text-sm text-gray-600 leading-relaxed">
                Generate EU Deforestation Regulation due diligence statements with satellite evidence for every farm parcel in your cooperative.
              </p>
              <Link
                href="/eudr"
                className="block w-full rounded-lg bg-[#1A7A6E] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#15635A]"
              >
                View Compliance →
              </Link>
            </div>

            {/* Card 4: Buyers */}
            <div className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-md border-t-4" style={{ borderTopColor: '#9333ea' }}>
              <span className="absolute right-4 top-4 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-purple-800 uppercase">
                B2B
              </span>
              <div className="text-4xl">🛒</div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">Buyer Portal</h3>
              <p className="mt-2 mb-6 flex-1 text-sm text-gray-600 leading-relaxed">
                Verified cooperative directory for commodity buyers. Filter by EUDR status, download due diligence packages, and connect with suppliers.
              </p>
              <Link
                href="/buyers"
                className="block w-full rounded-lg bg-[#1A7A6E] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#15635A]"
              >
                Open Buyer Portal →
              </Link>
            </div>

          </div>

          {/* Mago Score Card — demo preview */}
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Sustainability score (demo)</h2>
            <MagoScoreCard
              farmName="Demo Farm · KenyaCoop-B"
              overallScore={63}
              metrics={[
                { icon: '🌳', name: 'Deforestation-Free Compliance', score: 58, unit: '/100', certified: true },
                { icon: '🏅', name: 'Agroecology Practice Score', score: 58, unit: '/100', certified: false },
                { icon: '🦋', name: 'Biodiversity Score', score: 66, unit: '/100', certified: true },
                { icon: '💨', name: 'Carbon Footprint', score: 54, unit: 'tCO₂/ha', certified: false },
                { icon: '💧', name: 'Water Footprint', score: 47, unit: 'm³/ha', certified: true },
              ]}
              onGenerateReport={() => window.open('/eudr', '_blank')}
            />
          </div>
          
          {/* M4D Application Banner */}
          <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-xl bg-[#0D3D35] p-6 text-white shadow-lg md:flex-row md:p-8">
            <div>
              <h3 className="text-xl font-bold">📅 M4D Challenge Deadline</h3>
              <p className="mt-1 text-[#0DF5B4] font-medium">March 30, 2026 — 23 days remaining</p>
              <p className="mt-2 text-sm text-white/80">Track 4: Agroecology · Phase 1: $10,000</p>
            </div>
            <a
              href="https://oms.aws.venturewell.org/go/m4d-stage0-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full whitespace-nowrap rounded-lg bg-[#0DF5B4] px-8 py-3 text-center font-bold text-[#060A08] transition-colors hover:bg-white md:w-auto"
            >
              Apply Now →
            </a>
          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-[#060A08] py-6 text-center text-xs text-gray-400">
        <p>🌱 Mago · Powered by ESA Copernicus Sentinel-2 · M4D Open Innovation Challenge 2026</p>
      </footer>

      {/* Demo Overlay Banner (triggered via GlobalNav "Demo" link → /dashboard#demo) */}
      {isDemoMode && (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] border-t-2 border-[#0DF5B4] bg-[#0D3D35] p-4 text-white shadow-2xl">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
            {/* Step Indicator */}
            <div className="flex-shrink-0 text-sm font-semibold text-[#0DF5B4]">
              Step {demoStep + 1} of 5
            </div>

            {/* Demo Content */}
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-lg font-bold">{demoSteps[demoStep].title}</h4>
              <p className="mt-1 text-sm text-gray-300">{demoSteps[demoStep].text}</p>
              {demoSteps[demoStep].cta && (
                <button
                  onClick={demoSteps[demoStep].onClick || undefined}
                  className="mt-2 text-sm font-semibold text-[#0DF5B4] hover:underline"
                >
                  {demoSteps[demoStep].cta}
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-shrink-0 items-center gap-3">
              <button
                onClick={() => setIsDemoMode(false)}
                className="text-sm font-medium text-gray-400 hover:text-white"
              >
                ✕ Exit Demo
              </button>
              <button
                onClick={() => {
                  if (demoStep < demoSteps.length - 1) {
                    setDemoStep(demoStep + 1);
                  } else {
                    setIsDemoMode(false);
                  }
                }}
                className="rounded-lg bg-[#1A7A6E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-teal-600"
              >
                {demoStep < demoSteps.length - 1 ? 'Next →' : 'Finish ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
