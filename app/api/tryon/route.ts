import { NextResponse } from "next/server";
import { getTryOnProvider, ProviderError } from "@/lib/tryonProvider";
import type { TryOnErrorResponse, TryOnRequest, TryOnResponse } from "@/lib/types";

export const runtime = "nodejs";

function isImageDataUri(value: unknown, maxBytes: number): value is string {
  if (typeof value !== "string") return false;
  if (value.length > Math.ceil(maxBytes * 4 / 3) + 64) return false;
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  return Math.floor(match[2].length * 3 / 4) <= maxBytes;
}

function isTryOnRequest(value: unknown): value is TryOnRequest {
  return typeof value === "object" && value !== null &&
    "personImage" in value && isImageDataUri(value.personImage, 3 * 1024 * 1024) &&
    "garmentImage" in value && isImageDataUri(value.garmentImage, 5 * 1024 * 1024);
}

export async function POST(request: Request): Promise<NextResponse<TryOnResponse | TryOnErrorResponse>> {
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran permintaan terlalu besar." }, { status: 413 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Data permintaan tidak valid." }, { status: 400 });
  }
  if (!isTryOnRequest(payload)) {
    return NextResponse.json({ error: "Kirim foto kamera dan baju JPG/PNG yang valid (maksimal 5 MB)." }, { status: 400 });
  }

  try {
    const result = await getTryOnProvider().generate(payload);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ProviderError && error.message.startsWith("Server try-on belum")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Gagal memproses, coba lagi." }, { status: 502 });
  }
}
