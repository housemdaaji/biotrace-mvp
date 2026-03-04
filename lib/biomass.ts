/**
 * BioTrace Biomass & Carbon Proxy Formulas — v1.0
 * Source: BioTrace Satellite Data Specification doc
 *
 * AGB (Above-Ground Biomass):
 *   Formula: AGB = NDVI × 50
 *   Unit: t/ha (tonnes per hectare)
 *   Basis: Proxy model for smallholder mixed-crop systems;
 *          real allometric model in Phase 2 (CGIAR co-design)
 *
 * Carbon Sequestration Proxy:
 *   Formula: tCO₂e = AGB × 0.47 × 3.67
 *   Unit: tCO₂e/ha (tonnes CO₂ equivalent per hectare)
 *   Basis: IPCC carbon fraction (0.47) × CO₂/C ratio (3.67)
 *   Disclaimer: Proxy estimate only — not validated for
 *               carbon credit issuance
 */

export function computeAGB(ndvi: number): number {
  return parseFloat((ndvi * 50).toFixed(2));
}

export function computeCarbonProxy(agb: number): number {
  return parseFloat((agb * 0.47 * 3.67).toFixed(2));
}

export function agbRating(agb: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (agb >= 25)
    return {
      label: 'High Biomass',
      color: '#16a34a',
      bg: '#dcfce7',
    };
  if (agb >= 15)
    return {
      label: 'Moderate Biomass',
      color: '#d97706',
      bg: '#fef3c7',
    };
  return {
    label: 'Low Biomass',
    color: '#dc2626',
    bg: '#fee2e2',
  };
}

export function carbonRating(carbon: number): {
  label: string;
  color: string;
} {
  if (carbon >= 40) return { label: 'Strong sequestration', color: '#16a34a' };
  if (carbon >= 20) return { label: 'Moderate sequestration', color: '#d97706' };
  return { label: 'Low sequestration', color: '#dc2626' };
}
