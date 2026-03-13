'use client';

import { SatelliteIcon, AlertIcon, ChevronDownIcon, PencilIcon, HashIcon, RulerIcon, MapPinIcon, MedalIcon } from '@/components/Icons';

import { useEffect, useState } from 'react';

export interface SentinelResult {
  image: string;
  bbox: [number, number, number, number];
  index: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  onResult: (result: SentinelResult | null) => void;
  onDrawMode: (active: boolean) => void;
  isDrawing: boolean;
  pendingBBox: [number, number, number, number] | null;
  onBBoxConsumed: () => void;
}

const INDICES = [
  { id: 'NDVI', label: 'Vegetation Health' },
  { id: 'NDWI', label: 'Water Index' },
  { id: 'NDMI', label: 'Soil Moisture' },
  { id: 'BSI', label: 'Bare Soil' },
  { id: 'EVI', label: 'Enhanced Vegetation' },
  { id: 'NBR', label: 'Burn / Recovery' },
];

const ANALYSIS: Record<
  string,
  { legend: string; bullets: string[]; certification: string }
> = {
  NDVI: {
    legend:
      'Dark red = bare/stressed (−0.5) → Dark green = dense healthy (1.0)',
    bullets: [
      'Values >0.5 indicate dense canopy — qualifies for agroforestry score',
      'Values 0.2–0.5 suggest moderate vegetation — intercropping potential',
      'Values <0.2 flag bare soil or stressed crops — deforestation risk',
      'Temporal decline month-over-month triggers a Mago alert',
    ],
    certification:
      'NDVI >0.4 required for Mago Agroforestry certification tier',
  },
  NDWI: {
    legend: 'Brown = dry (−1.0) → Blue = water saturated (1.0)',
    bullets: [
      'Values >0.3 indicate surface water or flooded fields',
      'Values 0.0–0.3 suggest adequate moisture for most crops',
      'Values <−0.2 flag drought stress — triggers irrigation advisory',
      'Negative trend over 60 days signals water scarcity risk',
    ],
    certification:
      'NDWI >0.0 during growing season supports Water Management score',
  },
  NDMI: {
    legend: 'Dark red = very dry (−1.0) → Dark blue = very wet (1.0)',
    bullets: [
      'Values >0.2 indicate sufficient moisture retention in soil',
      'Values 0.0–0.2 suggest moderate moisture — monitor in dry season',
      'Values <−0.2 indicate drought stress or compacted soil',
      'Correlates with bio-input effectiveness and soil carbon storage',
    ],
    certification: 'Consistent NDMI >0.1 supports Soil Health practice score',
  },
  BSI: {
    legend: 'Dark green = vegetated (−1.0) → Brown = bare soil (1.0)',
    bullets: [
      'High BSI (>0.2) identifies soil exposure and erosion risk areas',
      'Low BSI (<−0.2) confirms good ground cover — reduces runoff',
      'Post-harvest BSI spike is normal — monitor recovery speed',
      'Persistent high BSI flags non-compliance with cover crop rules',
    ],
    certification:
      'BSI <0.2 between growing seasons required for Soil Protection score',
  },
  EVI: {
    legend: 'Red = sparse (−0.2) → Dark green = lush forest (1.0)',
    bullets: [
      'More sensitive than NDVI in dense canopy areas',
      'Values >0.4 confirm established agroforestry systems',
      'Values <0.1 in forest zones flag potential clearing activity',
      'Used to detect shade-grown coffee and tea systems',
    ],
    certification:
      'EVI >0.35 required for premium shade-grown certification tier',
  },
  NBR: {
    legend: 'Orange = recently burned (−1.0) → Green = healthy unburned (1.0)',
    bullets: [
      'Negative values flag recent burning or severe vegetation loss',
      'Values 0.1–0.4 indicate recovering vegetation after disturbance',
      'Values >0.4 confirm healthy unburned vegetation',
      'Critical for EUDR deforestation-free compliance verification',
    ],
    certification:
      'NBR >0.2 required — negative values trigger deforestation flag',
  },
};

export default function SentinelPanel({
  onResult,
  onDrawMode,
  isDrawing,
  pendingBBox,
  onBBoxConsumed,
}: Props) {
  return null;
}
