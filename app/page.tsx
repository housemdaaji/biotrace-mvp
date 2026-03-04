import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <section
        className="w-full px-4 py-16 sm:px-6 sm:py-24 lg:py-28"
        style={{ backgroundColor: '#1A7A6E' }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Satellite-Verified Agroecological Certification
          </h1>
          <p className="mt-6 text-lg text-white/95 sm:text-xl">
            BioTrace replaces $5,000 physical audits with continuous Sentinel-2 satellite
            monitoring — making certification accessible to every smallholder cooperative.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/map"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#1A7A6E] shadow-sm hover:bg-white/95 transition-colors"
            >
              View Map →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#1A7A6E] shadow-sm hover:bg-white/95 transition-colors"
            >
              Open Dashboard →
            </Link>
            <Link
              href="/buyers"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#1A7A6E] shadow-sm hover:bg-white/95 transition-colors"
            >
              Buyer Portal →
            </Link>
          </div>
        </div>
      </section>

      {/* Demo banner */}
      <div className="border-b border-[#1A7A6E]/20 bg-[#1A7A6E]/10 px-4 py-2 text-center text-sm text-[#1A7A6E]">
        🛰 Live demo — 3 cooperatives · 10 farms · Meru County, Kenya · Sentinel-2 mock data ·{' '}
        <span className="font-medium">M4D Open Innovation Challenge 2026</span>
      </div>

      {/* Stats row */}
      <section className="border-b border-gray-200 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1A7A6E] sm:text-4xl">400M+</p>
            <p className="mt-1 text-sm font-medium text-gray-600">Smallholders</p>
            <p className="mt-0.5 text-sm text-gray-500">excluded from certified markets</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1A7A6E] sm:text-4xl">$5,000</p>
            <p className="mt-1 text-sm font-medium text-gray-600">average cost</p>
            <p className="mt-0.5 text-sm text-gray-500">of physical audit</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1A7A6E] sm:text-4xl">5 days</p>
            <p className="mt-1 text-sm font-medium text-gray-600">Sentinel-2</p>
            <p className="mt-0.5 text-sm text-gray-500">satellite revisit time</p>
          </div>
        </div>
      </section>

      {/* Features row */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="text-2xl" aria-hidden>🛰</span>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Satellite Monitoring</h2>
              <p className="mt-2 text-sm text-gray-600">
                Continuous NDVI and land-use analysis via free Sentinel-2 imagery.
              </p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="text-2xl" aria-hidden>📜</span>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Digital Certificates</h2>
              <p className="mt-2 text-sm text-gray-600">
                QR-verified certificates with tamper-proof satellite data links.
              </p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <span className="text-2xl" aria-hidden>🌍</span>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Market Access</h2>
              <p className="mt-2 text-sm text-gray-600">
                Connect EUDR-compliant cooperatives directly with ESG-conscious buyers.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 sm:px-6">
        BioTrace © 2026 · M4D Open Innovation Challenge · Agroecology Track
      </footer>
    </main>
  );
}
