export interface GarmentImage {
  name: string;
  dataUrl: string;
}

export interface TryOnRequest {
  personImage: string;
  garmentImage: string;
}

export interface TryOnResponse {
  imageUrl: string;
}

export interface TryOnErrorResponse {
  error: string;
}

export interface TryOnConfig {
  mode: "decart" | "image";
  configured: boolean;
}

export interface DecartTokenResponse {
  apiKey: string;
  expiresAt: string;
}
