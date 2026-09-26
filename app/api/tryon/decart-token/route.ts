import { createDecartClient } from "@decartai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.DECART_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "DECART_API_KEY belum diisi di .env.local." }, { status: 503 });
  }

  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || requestOrigin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Asal permintaan tidak valid." }, { status: 403 });
  }

  try {
    const client = createDecartClient({ apiKey });
    const token = await client.tokens.create({
      expiresIn: 60,
      allowedModels: ["lucy-vton-3.5"],
      allowedOrigins: [requestOrigin],
      constraints: { realtime: { maxSessionDuration: 120 } },
    });
    return NextResponse.json(
      { apiKey: token.apiKey, expiresAt: token.expiresAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Gagal membuat token Decart. Periksa API key dan saldo kredit." }, { status: 502 });
  }
}
