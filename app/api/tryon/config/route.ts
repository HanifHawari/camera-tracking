import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const decartConfigured = Boolean(process.env.DECART_API_KEY?.trim());
  const imageConfigured = Boolean(process.env.TRYON_API_URL?.trim() || process.env.TRYON_API_KEY?.trim());

  return NextResponse.json(
    { mode: decartConfigured ? "decart" : "image", configured: decartConfigured || imageConfigured },
    { headers: { "Cache-Control": "no-store" } },
  );
}
