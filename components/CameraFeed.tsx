"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { useSessionStore } from "@/store/useSessionStore";

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement>;
  enabled: boolean;
  mirrored: boolean;
}

export default function CameraFeed({ videoRef, enabled, mirrored }: CameraFeedProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraReady = useSessionStore((state) => state.cameraReady);
  const setCameraReady = useSessionStore((state) => state.setCameraReady);

  useEffect(() => {
    if (!enabled) {
      setCameraReady(false);
      return;
    }
    let active = true;
    let stream: MediaStream | null = null;
    const video = videoRef.current;
    setCameraError(null);
    async function openCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Browser atau koneksi ini tidak mendukung akses kamera.");
        return;
      }
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: false,
        });
        if (!active) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (video) video.srcObject = media;
      } catch (error) {
        if (!active) return;
        const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
        setCameraError(denied ? "Izin kamera ditolak. Izinkan kamera di pengaturan browser, lalu muat ulang halaman." : "Kamera tidak dapat diakses. Periksa kamera atau aplikasi lain yang menggunakannya.");
      }
    }
    void openCamera();
    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
      setCameraReady(false);
    };
  }, [enabled, setCameraReady, videoRef]);

  return (
    <div className="camera-grid relative aspect-[4/5] min-h-[380px] overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={() => { if (enabled) setCameraReady(true); }}
        className={"absolute inset-0 h-full w-full object-cover " + (mirrored ? "-scale-x-100" : "")}
        aria-label="Tampilan kamera asli"
      />
      <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-white/20" aria-hidden="true" />
      <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-white/20" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/20" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/20" aria-hidden="true" />
      {(!enabled || !cameraReady) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1c202b] text-slate-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M7 5l1.5-2h7L17 5" /></svg>
          </div>
          <p className="max-w-xs text-sm font-semibold text-slate-100">{!enabled ? "Kamera Dimatikan" : cameraError ?? "Menghubungkan kamera Anda..."}</p>
          <p className="mt-1 max-w-xs text-xs leading-4 text-slate-400">{!enabled ? "Hidupkan kamera untuk melihat tampilan asli." : cameraError ? "Periksa izin dan koneksi kamera Anda." : "Izinkan akses kamera jika browser meminta izin."}</p>
        </div>
      )}
      {enabled && cameraReady && <span className="absolute left-4 top-4 flex items-center gap-2 rounded-md border border-white/10 bg-[#181b24]/80 px-2 py-1 text-[10px] font-bold uppercase text-slate-100"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live</span>}
    </div>
  );
}
