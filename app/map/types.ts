export type GeoJSONPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

export interface Farm {
  id: string;
  cooperativeId: string;
  farmerName: string;
  lat: number;
  lng: number;
  apsScore: number;
  soilScore: number;
  waterScore: number;
  biodiversityScore: number;
  deforestationScore: number;
  carbonScore: number;
  certificateId: string | null;
  certificateDate: string | null;
  status: 'certified' | 'pending' | 'at-risk';
  boundary: GeoJSONPolygon;
  deforestationRisk: boolean;
  /** Optional: from Sentinel-2 / ndvi_grid; used to compute AGB & carbon proxy */
  ndvi?: number;
  /** Optional: computed from NDVI (AGB = NDVI × 50), not stored */
  agb?: number;
  /** Optional: computed from AGB (tCO₂e = AGB × 0.47 × 3.67), not stored */
  carbonProxy?: number;
}

export interface Cooperative {
  id: string;
  name: string;
  location: string;
  country: string;
  crop: string;
  farmerCount: number;
  certifiedFarmers: number;
  apsScore: number;
  lat: number;
  lng: number;
  lastUpdated: string;
}
