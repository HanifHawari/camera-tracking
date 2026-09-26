"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CameraFeed from "@/components/CameraFeed";
import DecartSession from "@/components/DecartSession";
import ResultCamera from "@/components/ResultCamera";
import GarmentUploader from "@/components/GarmentUploader";
import GenerateButton from "@/components/GenerateButton";
import StatusBar from "@/components/StatusBar";
import { captureFrame } from "@/lib/captureFrame";
import type { GarmentImage, TryOnConfig, TryOnResponse } from "@/lib/types";
import { useSessionStore } from "@/store/useSessionStore";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [config, setConfig] = useState<TryOnConfig | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraMirrored, setCameraMirrored] = useState(false);
  const isLive = useSessionStore((state) => state.isLive);
  const isProcessing = useSessionStore((state) => state.isProcessing);
  const cameraReady = useSessionStore((state) => state.cameraReady);
  const garmentImage = useSessionStore((state) => state.garmentImage);
  const lastResult = useSessionStore((state) => state.lastResult);
  const error = useSessionStore((state) => state.error);
  const startedAt = useSessionStore((state) => state.startedAt);
  const setIsLive = useSessionStore((state) => state.setIsLive);
  const setIsProcessing = useSessionStore((state) => state.setIsProcessing);
  const setGarmentImage = useSessionStore((state) => state.setGarmentImage);
  const setLastResult = useSessionStore((state) => state.setLastResult);
  const setError = useSessionStore((state) => state.setError);
  const start = useSessionStore((state) => state.start);
  const isRealtime = config?.mode === "decart";

  useEffect(() => {
    let active = true;
    async function loadConfig() {
      try {
        const response = await fetch("/api/tryon/config", { cache: "no-store" });
        const data: unknown = await response.json();
        if (!response.ok || typeof data !== "object" || data === null || !("mode" in data) ||
          (data.mode !== "decart" && data.mode !== "image") || !("configured" in data) || typeof data.configured !== "boolean") {
          throw new Error("Konfigurasi provider tidak valid.");
        }
        if (active) setConfig({ mode: data.mode, configured: data.configured });
      } catch {
        if (active) {
          setConfig({ mode: "image", configured: false });
          setError("Gagal membaca konfigurasi provider. Muat ulang halaman.");
        }
      }
    }
    void loadConfig();
    return () => { active = false; };
  }, [setError]);

  useEffect(() => {
    if (!isLive || !garmentImage || config?.mode !== "image") return;
    let active = true;
    let inFlight = false;
    let controller: AbortController | null = null;

    async function generate() {
      if (!active || inFlight || !videoRef.current) return;
      inFlight = true;
      controller = new AbortController();
      setIsProcessing(true);
      try {
        const personImage = captureFrame(videoRef.current);
        const response = await fetch("/api/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personImage, garmentImage: garmentImage!.dataUrl }),
          cache: "no-store",
          signal: controller.signal,
        });
        const data: TryOnResponse | { error?: string } = await response.json();
        if (!response.ok) throw new Error("error" in data && data.error ? data.error : "Gagal memproses, coba lagi.");
        if (!("imageUrl" in data) || typeof data.imageUrl !== "string") throw new Error("Gagal memproses, coba lagi.");
        if (active) setLastResult(data.imageUrl);
      } catch (cause) {
        if (active && !(cause instanceof DOMException && cause.name === "AbortError")) {
          setError(cause instanceof Error ? cause.message : "Gagal memproses, coba lagi.");
          setIsLive(false);
        }
      } finally {
        inFlight = false;
        if (active) setIsProcessing(false);
      }
    }

    void generate();
    const timer = window.setInterval(() => void generate(), 3500);
    return () => {
      active = false;
      window.clearInterval(timer);
      controller?.abort();
      setIsProcessing(false);
    };
  }, [isLive, garmentImage, config?.mode, setError, setIsLive, setIsProcessing, setLastResult]);

  const handleResultError = useCallback(() => {
    setError("Gagal menampilkan hasil try-on. Coba mulai sesi lagi.");
    setIsLive(false);
  }, [setError, setIsLive]);

  function selectGarment(value: GarmentImage | null) {
    setIsLive(false);
    setRemoteStream(null);
    setGarmentImage(value);
    setLastResult(null);
    setError(null);
  }

  function stop() {
    setIsLive(false);
    setIsProcessing(false);
    setRemoteStream(null);
  }

  function toggleCamera() {
    if (cameraEnabled) stop();
    setCameraEnabled(!cameraEnabled);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1117] text-slate-200">
      <header className="border-b border-white/10 bg-[#0f1117]">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/30 bg-[#881337] text-white shadow-lg shadow-rose-900/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1L2 14.5A2 2 0 0 0 3.5 18h17a2 2 0 0 0 1.5-3.5L14.2 7.1A3 3 0 0 0 12 2Z" /><path d="M12 18v3" /></svg>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-white">Studio<span className="text-[#be123c]">Try-On</span></p>
              <p className="text-[10px] text-slate-400">Virtual Fitting Room <span className="px-1 text-[#9f1239]">•</span> {isRealtime ? "AI Realtime" : "AI Preview"}</p>
            </div>
          </div>
          <StatusBar isLive={isLive} startedAt={startedAt} isProcessing={isProcessing} />
        </div>
      </header>

      {error && (
        <div role="alert" className="mx-4 mt-4 flex items-start justify-between gap-4 rounded-xl border border-[#9f1239]/60 bg-[#301822] px-4 py-3 text-sm text-rose-100 lg:mx-6">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Tutup pesan kesalahan" className="font-bold text-rose-200 hover:text-white">×</button>
        </div>
      )}

      <main className="mx-auto grid w-full max-w-[1720px] flex-1 grid-cols-1 items-start gap-4 p-4 md:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:gap-5 lg:p-6">
        <section className="order-2 flex min-w-0 flex-col gap-4 md:order-1" aria-label="Kamera dan hasil try-on">
          <div className="rounded-2xl border border-white/10 bg-[#181b24] px-5 py-4 shadow-xl sm:px-6">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Lihat baju pilihan kamu, <span className="text-[#be123c]">lalu lihat hasilnya.</span></h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm">Aktifkan kamera, pilih katalog busana atau unggah foto, dan pantau hasil virtual try-on.</p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <article className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#181b24] shadow-xl">
              <div className="flex min-h-12 items-center justify-between gap-2 border-b border-white/5 bg-[#1c202b] px-3 py-2 sm:px-4">
                <div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Kamera Asli</h2><p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">Input feed</p></div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setCameraMirrored(!cameraMirrored)} aria-pressed={cameraMirrored} className={"rounded-md border px-2 py-1 text-[11px] font-medium transition " + (cameraMirrored ? "border-[#9f1239] bg-[#9f1239]/30 text-rose-200" : "border-white/5 bg-[#202636] text-slate-300 hover:text-white")}>Cermin {cameraMirrored ? "Aktif" : "Mati"}</button>
                  <button type="button" onClick={toggleCamera} className="rounded-md border border-[#9f1239]/40 bg-[#881337]/40 px-2 py-1 text-[11px] font-medium text-rose-200 transition hover:bg-[#881337]/70">{cameraEnabled ? "Matikan" : "Hidupkan"}</button>
                </div>
              </div>
              <CameraFeed videoRef={videoRef} enabled={cameraEnabled} mirrored={cameraMirrored} />
              <div className="h-3 border-t border-white/5 bg-[#181b24]" aria-hidden="true" />
            </article>

            <article className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#181b24] shadow-xl">
              <div className="flex min-h-12 items-center justify-between gap-2 border-b border-white/5 bg-[#1c202b] px-3 py-2 sm:px-4">
                <div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">Hasil Try-On</h2><p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">Output feed · Synthesis</p></div>
                <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-300">AI Preview</span>
              </div>
              <ResultCamera imageUrl={lastResult} remoteStream={remoteStream} isRealtime={isRealtime} isProcessing={isProcessing} mirrored={cameraMirrored} onImageError={handleResultError} />
              <div className="h-3 border-t border-white/5 bg-[#181b24]" aria-hidden="true" />
            </article>
          </div>
        </section>

        <aside className="order-1 flex min-w-0 flex-col gap-5 md:order-2" aria-label="Pilihan baju dan kontrol sesi">
          <GarmentUploader garment={garmentImage} onSelect={selectGarment} onError={(message) => setError(message || null)} />
          <div className="space-y-2">
            <GenerateButton isLive={isLive} disabled={!cameraEnabled || !cameraReady || !garmentImage || !config?.configured} onGenerate={start} onStop={stop} />
            {(!config || !config.configured) && <p className="text-center text-[11px] leading-4 text-slate-400">{config ? "Provider belum dikonfigurasi." : "Memeriksa provider..."}</p>}
          </div>
        </aside>
      </main>

      <footer className="border-t border-white/5 bg-[#141721] px-4 py-4 lg:px-6">
        <div className="mx-auto flex max-w-[1720px] items-start gap-2 text-xs leading-5 text-slate-400">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4" /><path d="M12 2.5 3.5 6v5.5c0 5.2 3.6 9.1 8.5 10 4.9-.9 8.5-4.8 8.5-10V6L12 2.5Z" /></svg>
          <p>Dengan memulai sesi, Anda menyetujui pengiriman video kamera dan foto baju ke penyedia AI untuk diproses. Aplikasi ini tidak menyimpan gambar secara permanen; kebijakan penyimpanan penyedia AI dapat berbeda.</p>
        </div>
      </footer>
      {isLive && isRealtime && garmentImage && <DecartSession videoRef={videoRef} garment={garmentImage} onStream={setRemoteStream} />}
    </div>
  );
}
