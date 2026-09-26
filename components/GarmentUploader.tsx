"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import type { GarmentImage } from "@/lib/types";

interface GarmentUploaderProps {
  garment: GarmentImage | null;
  onSelect: (garment: GarmentImage | null) => void;
  onError: (message: string) => void;
}

const examples = [
  { name: "Kaus Gaston", front: "/samples/gaston-front.jpg", back: "/samples/gaston-back.jpg" },
  { name: "Jersey Maroon", front: "/samples/maroon-front.jpeg", back: "/samples/maroon-back.jpeg" },
  { name: "Jersey Putih", front: "/samples/white-front.jpeg", back: "/samples/white-back.jpeg" },
] as const;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Gagal membaca foto baju."));
    reader.onerror = () => reject(new Error("Gagal membaca foto baju."));
    reader.readAsDataURL(file);
  });
}

export default function GarmentUploader({ garment, onSelect, onError }: GarmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  async function selectFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      onError("Gunakan foto baju berformat JPG atau PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Ukuran foto baju maksimal 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      onSelect({ name: file.name, dataUrl });
      onError("");
    } catch {
      onError("Gagal membaca foto baju.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function selectExample(name: string, side: "Depan" | "Belakang", path: string) {
    setBusy(true);
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      await selectFile(new File([blob], `${name} (${side}).${blob.type === "image/png" ? "png" : "jpg"}`, { type: blob.type }));
    } catch {
      onError("Gagal memuat contoh baju.");
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void selectFile(event.dataTransfer.files[0]);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    void selectFile(event.target.files?.[0]);
  }

  return (
    <section className="flex min-h-0 flex-col gap-2 rounded-2xl border border-white/10 bg-[#181b24] p-4 shadow-xl">
      <div className="border-b border-white/5 pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Pilih Baju Kamu</h2>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">Unggah foto atau pilih baju dari katalog.</p>
      </div>

      <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} className={"flex min-h-20 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-2 text-center transition " + (dragging ? "border-[#9f1239] bg-[#25202b]" : "border-white/15 bg-[#141721] hover:border-[#9f1239]/70")}>
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#202636] text-slate-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4 4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
        </div>
        <p className="text-xs font-semibold text-slate-200">Seret foto ke sini atau <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="text-rose-400 underline underline-offset-2 disabled:opacity-50">pilih file</button></p>
        <p className="mt-1 text-[11px] text-slate-400">JPG atau PNG · Maksimal 5 MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={handleChange} className="sr-only" aria-label="Pilih foto baju" />

      {garment && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#202636] p-2">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white"><Image src={garment.dataUrl} alt={"Foto " + garment.name} width={48} height={48} unoptimized loading="eager" className="h-full w-full object-contain" /></div>
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{garment.name}</p><p className="text-[11px] text-slate-400">Siap untuk dicoba</p></div>
          <button type="button" onClick={() => onSelect(null)} aria-label="Hapus foto baju" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white">×</button>
        </div>
      )}

      <div className="flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Koleksi Pilihan · Contoh Baju</span><span className="h-px flex-1 bg-white/10" /></div>
      <div className="catalog-scrollbar space-y-3 md:max-h-[330px] md:overflow-y-auto md:pr-1">
        {examples.map((example) => {
          const selected = garment?.name.startsWith(example.name + " (") ?? false;
          return (
            <div key={example.name} className={"rounded-xl border p-3 transition " + (selected ? "border-[#9f1239] bg-[#20202a]" : "border-white/10 bg-[#1c202b]")}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="min-w-0 text-xs font-bold text-white">{example.name}</p>
                {selected && <span className="shrink-0 rounded border border-[#9f1239]/40 bg-[#9f1239]/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-300">Terpilih</span>}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {([["Depan", example.front], ["Belakang", example.back]] as const).map(([side, path]) => {
                  const sideSelected = garment?.name.startsWith(example.name + " (" + side + ")") ?? false;
                  return (
                    <button key={side} type="button" disabled={busy} aria-pressed={sideSelected} aria-label={"Pilih " + example.name + " tampak " + side.toLowerCase()} onClick={() => void selectExample(example.name, side, path)} className={"group min-w-0 rounded-lg border bg-[#111318] p-1.5 text-center transition hover:border-[#9f1239] disabled:opacity-50 " + (sideSelected ? "border-[#9f1239]" : "border-white/10")}>
                      <div className="relative overflow-hidden rounded bg-[#141b29]">
                        <Image src={path} alt={example.name + " tampak " + side.toLowerCase()} width={256} height={256} className="h-24 w-full object-contain transition group-hover:scale-105" />
                        <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-slate-200">{side === "Depan" ? "FRONT" : "BACK"}</span>
                      </div>
                      <span className="mt-1 block rounded bg-white/5 py-1 text-[11px] font-semibold text-slate-200">{side}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
