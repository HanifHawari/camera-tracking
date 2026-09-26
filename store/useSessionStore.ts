import { create } from "zustand";
import type { GarmentImage } from "@/lib/types";

interface SessionState {
  isLive: boolean;
  isProcessing: boolean;
  cameraReady: boolean;
  garmentImage: GarmentImage | null;
  lastResult: string | null;
  error: string | null;
  startedAt: number | null;
  setIsLive: (value: boolean) => void;
  setIsProcessing: (value: boolean) => void;
  setCameraReady: (value: boolean) => void;
  setGarmentImage: (value: GarmentImage | null) => void;
  setLastResult: (value: string | null) => void;
  setError: (value: string | null) => void;
  start: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isLive: false,
  isProcessing: false,
  cameraReady: false,
  garmentImage: null,
  lastResult: null,
  error: null,
  startedAt: null,
  setIsLive: (isLive) => set({ isLive }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setCameraReady: (cameraReady) => set({ cameraReady }),
  setGarmentImage: (garmentImage) => set({ garmentImage }),
  setLastResult: (lastResult) => set({ lastResult }),
  setError: (error) => set({ error }),
  start: () => set({ isLive: true, error: null, startedAt: Date.now() }),
}));
