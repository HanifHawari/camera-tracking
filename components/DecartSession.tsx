"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { createDecartClient, models } from "@decartai/sdk";
import type { RealTimeClient } from "@decartai/sdk";
import type { DecartTokenResponse, GarmentImage } from "@/lib/types";
import { useSessionStore } from "@/store/useSessionStore";

interface DecartSessionProps {
  videoRef: RefObject<HTMLVideoElement>;
  garment: GarmentImage;
  onStream: (stream: MediaStream | null) => void;
}

const model = models.realtime("lucy-vton-3.5");

function isDecartToken(value: unknown): value is DecartTokenResponse {
  return typeof value === "object" && value !== null &&
    "apiKey" in value && typeof value.apiKey === "string" &&
    "expiresAt" in value && typeof value.expiresAt === "string";
}

export default function DecartSession({ videoRef, garment, onStream }: DecartSessionProps) {
  const setIsLive = useSessionStore((state) => state.setIsLive);
  const setIsProcessing = useSessionStore((state) => state.setIsProcessing);
  const setError = useSessionStore((state) => state.setError);

  useEffect(() => {
    let active = true;
    let connection: RealTimeClient | null = null;
    let timeout: number | null = null;

    function fail(message: string) {
      if (!active) return;
      setError(message);
      setIsProcessing(false);
      setIsLive(false);
    }

    async function connect() {
      setIsProcessing(true);
      try {
        const cameraStream = videoRef.current?.srcObject;
        if (!(cameraStream instanceof MediaStream)) {
          throw new Error("Kamera belum siap. Coba lagi sebentar.");
        }

        const tokenResponse = await fetch("/api/tryon/decart-token", { method: "POST", cache: "no-store" });
        const token: unknown = await tokenResponse.json();
        if (!tokenResponse.ok || !isDecartToken(token)) {
          throw new Error("Gagal mendapatkan token Decart. Periksa API key dan saldo kredit.");
        }
        if (!active) return;

        const garmentBlob = await (await fetch(garment.dataUrl)).blob();
        if (!active) return;
        const garmentFile = new File([garmentBlob], garment.name, { type: garmentBlob.type });
        const client = createDecartClient({ apiKey: token.apiKey });

        timeout = window.setTimeout(() => fail("Decart belum mengirim video. Coba mulai sesi lagi."), 45000);
        const session = await client.realtime.connect(cameraStream, {
          model,
          mirror: "auto",
          initialState: {
            prompt: { text: "Substitute the current top with the garment in the reference image.", enhance: true },
            image: garmentFile,
          },
          onRemoteStream: (stream) => {
            if (!active) return;
            if (timeout !== null) window.clearTimeout(timeout);
            timeout = null;
            onStream(stream);
            setIsProcessing(false);
          },
        });

        if (!active) {
          session.disconnect();
          return;
        }
        connection = session;
        session.on("error", () => fail("Sesi Decart terputus. Periksa koneksi dan coba lagi."));
        session.on("sessionEnded", () => fail("Batas 2 menit sesi Decart tercapai. Tekan Generate untuk memulai sesi baru."));
        session.on("connectionChange", (state) => {
          if (state === "disconnected") fail("Sesi Decart terputus. Tekan Generate untuk menghubungkan ulang.");
        });
      } catch (error) {
        fail(error instanceof Error && error.message === "Kamera belum siap. Coba lagi sebentar."
          ? error.message
          : "Gagal menghubungkan Decart. Periksa API key, saldo kredit, dan koneksi.");
      }
    }

    void connect();
    return () => {
      active = false;
      if (timeout !== null) window.clearTimeout(timeout);
      connection?.disconnect();
      onStream(null);
      setIsProcessing(false);
    };
  }, [garment, onStream, setError, setIsLive, setIsProcessing, videoRef]);

  return null;
}
