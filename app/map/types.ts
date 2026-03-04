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
