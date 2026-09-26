export default function Loading() {
  return (
    <main className="mx-auto grid max-w-[1720px] gap-4 p-4 md:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:p-6">
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-[#181b24]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#181b24]" />
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#181b24]" />
        </div>
      </div>
      <div className="h-[560px] animate-pulse rounded-2xl bg-[#181b24]" />
    </main>
  );
}
