"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ResultCameraProps {
  imageUrl: string | null;
  remoteStream: MediaStream | null;
  isRealtime: boolean;
  isProcessing: boolean;
  mirrored: boolean;
  onImageError: () => void;
}

export default function ResultCamera({ imageUrl, remoteStream, isRealtime, isProcessing, mirrored, onImageError }: ResultCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<string | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setCurrent(null);
      setIncoming(null);
      return;
    }
    if (!current) setCurrent(imageUrl);
    else if (imageUrl !== current) {
      setIncoming(imageUrl);
      setFading(false);
    }
    // current is intentionally omitted: only a new provider result starts a transition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  useEffect(() => {
    if (!fading || !incoming) return;
    const timer = window.setTimeout(() => {
      setCurrent(incoming);
      setIncoming(null);
      setFading(false);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [fading, incoming]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = remoteStream;
    if (remoteStream) void video.play().catch(onImageError);
    return () => { video.srcObject = null; };
  }, [remoteStream, onImageError]);

  return (
    <div className="camera-grid relative aspect-[4/5] min-h-[380px] overflow-hidden">
      {isRealtime ? (
        <video ref={videoRef} autoPlay playsInline muted aria-label="Video hasil virtual try-on Decart" onError={onImageError} className={"absolute inset-0 h-full w-full object-cover " + (remoteStream ? "block " : "hidden ") + (mirrored ? "-scale-x-100" : "")} />
      ) : (
        <>
          {current && <Image src={current} alt="Hasil virtual try-on" fill sizes="(min-width: 768px) 35vw, 100vw" unoptimized loading="eager" className={"object-cover " + (mirrored ? "-scale-x-100" : "")} onError={onImageError} />}
          {incoming && <Image src={incoming} alt="Hasil virtual try-on terbaru" fill sizes="(min-width: 768px) 35vw, 100vw" unoptimized loading="eager" onLoad={() => setFading(true)} onError={onImageError} className={"object-cover transition-opacity duration-300 " + (fading ? "opacity-100 " : "opacity-0 ") + (mirrored ? "-scale-x-100" : "")} />}
        </>
      )}
      <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-white/20" aria-hidden="true" />
      <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-white/20" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/20" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/20" aria-hidden="true" />
      {!(isRealtime ? remoteStream : current) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          {isProcessing ? (
            <>
              <div className="spin mb-3 h-10 w-10 rounded-full border-[3px] border-[#9f1239]/20 border-t-[#be123c]" />
              <p className="text-sm font-semibold text-slate-100">{isRealtime ? "Menghubungkan video Decart..." : "Membuat hasil try-on pertama..."}</p>
              <p className="mt-1 max-w-xs text-xs leading-4 text-slate-400">Ini dapat memakan waktu sesuai antrean model AI.</p>
            </>
          ) : (
            <>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1c202b] text-slate-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="M19 17l.6 1.4L21 19l-1.4.6L19 21l-.6-1.4L17 19l1.4-.6L19 17Z" /></svg>
              </div>
              <p className="text-sm font-semibold text-slate-100">Hasil akan tampil di sini</p>
              <p className="mt-1 max-w-xs text-xs leading-4 text-slate-400">Pilih busana, lalu tekan Generate Try-On untuk mulai mencoba pakaian secara virtual.</p>
            </>
          )}
        </div>
      )}
      {!isRealtime && current && isProcessing && <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md border border-white/10 bg-[#181b24]/80 px-2 py-1 text-[10px] font-medium text-slate-100"><span className="spin h-3 w-3 rounded-full border-2 border-[#9f1239]/20 border-t-[#be123c]" />Memperbarui</span>}
    </div>
  );
}
