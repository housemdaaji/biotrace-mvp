'use client';

import GlobalNav from '@/components/GlobalNav';

const FEATURED_BUYERS = [
  {
    name: 'Nordic Roasters AS',
    country: 'Norway',
    flag: '🇳🇴',
    crops: ['Coffee', 'Tea'],
    note: 'Sourcing EUDR-compliant specialty coffee from East Africa',
  },
  {
    name: 'Terra Verde GmbH',
    country: 'Germany',
    flag: '🇩🇪',
    crops: ['Cocoa', 'Coffee'],
    note: 'ESG-verified supply chains for European retail markets',
  },
  {
    name: 'Sahara Organics Ltd',
    country: 'United Kingdom',
    flag: '🇬🇧',
    crops: ['Olive', 'Tea'],
    note: 'Premium organic imports with full traceability requirements',
  },
  {
    name: 'GreenSource SARL',
    country: 'France',
    flag: '🇫🇷',
    crops: ['Coffee', 'Cocoa'],
    note: 'Connecting European food brands with certified smallholders',
  },
];

export default function BuyersPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GlobalNav activePage="buyers" />
      <main className="max-w-5xl mx-auto px-4 py-10 flex-1">
        {/* Hero header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#2D5A2E] mb-2">
            🛒 Buyer Network
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Connect with verified agroecology cooperatives across East Africa
            and North Africa. Every listing is satellite-verified and
            EUDR-compliant.
          </p>
        </div>

        {/* CTA banner */}
        <div className="bg-[#2D5A2E] text-white rounded-xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Source with confidence</h2>
            <p className="text-green-100 text-sm">
              Register as a buyer to access the full cooperative directory,
              ESG reports, and direct sourcing inquiries.
            </p>
          </div>
          <a
            href="mailto:contact@flahtik.com?subject=Buyer Registration - Mago"
            className="shrink-0 bg-white text-[#2D5A2E] font-semibold px-5 py-2.5 rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            Register as a Buyer →
          </a>
        </div>

        {/* Featured buyer cards */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Featured Buyers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_BUYERS.map((buyer) => (
            <div
              key={buyer.name}
              className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{buyer.name}</p>
                  <p className="text-sm text-gray-500">
                    {buyer.flag} {buyer.country}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{buyer.note}</p>
              <div className="flex flex-wrap gap-1">
                {buyer.crops.map((crop) => (
                  <span
                    key={crop}
                    className="text-xs bg-green-50 text-[#2D5A2E] px-2 py-0.5 rounded-full border border-green-200"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
