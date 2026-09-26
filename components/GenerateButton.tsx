interface GenerateButtonProps {
  isLive: boolean;
  disabled: boolean;
  onGenerate: () => void;
  onStop: () => void;
}

export default function GenerateButton({ isLive, disabled, onGenerate, onStop }: GenerateButtonProps) {
  return (
    <button
      type="button"
      disabled={!isLive && disabled}
      onClick={isLive ? onStop : onGenerate}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${isLive ? "border-[#9f1239]/60 bg-[#881337] hover:bg-[#9f1239]" : "border-white/10 bg-[#202636] enabled:hover:border-[#9f1239] enabled:hover:bg-[#9f1239]"}`}
    >
      {isLive ? (
        <><span className="h-3 w-3 rounded-sm bg-current" />Jeda sesi</>
      ) : (
        <>Generate Try-On</>
      )}
    </button>
  );
}
