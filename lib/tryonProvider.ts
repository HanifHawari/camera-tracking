import { fal } from "@fal-ai/client";
import type { TryOnRequest, TryOnResponse } from "@/lib/types";

export interface TryOnProvider {
  generate(input: TryOnRequest): Promise<TryOnResponse>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

export function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= 2 || (error instanceof ProviderError && error.status !== undefined && error.status < 500 && error.status !== 429)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
}

export function createCustomProvider(url: string, apiKey?: string, fetcher: typeof fetch = fetch): TryOnProvider {
  const endpoint = new URL(url);
  if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1"].includes(endpoint.hostname))) {
    throw new ProviderError("Endpoint try-on harus HTTPS atau localhost.");
  }

  return {
    async generate(input) {
      return withRetry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000);
        try {
          const response = await fetcher(endpoint.toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify(input),
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) throw new ProviderError("Provider gagal memproses gambar.", response.status);
          const payload: unknown = await response.json();
          const imageUrl = typeof payload === "object" && payload !== null && "imageUrl" in payload ? payload.imageUrl : null;
          if (!isSafeImageUrl(imageUrl)) throw new ProviderError("Respons provider tidak berisi gambar yang valid.");
          return { imageUrl };
        } finally {
          clearTimeout(timeout);
        }
      });
    },
  };
}

export function createFalProvider(apiKey: string): TryOnProvider {
  fal.config({ credentials: apiKey });
  return {
    async generate(input) {
      return withRetry(async () => {
        const result = await fal.subscribe("fal-ai/leffa/virtual-tryon", {
          input: {
            human_image_url: input.personImage,
            garment_image_url: input.garmentImage,
            garment_type: "upper_body",
          },
        });
        const data: unknown = result.data;
        const image = typeof data === "object" && data !== null && "image" in data ? data.image : null;
        const imageUrl = typeof image === "object" && image !== null && "url" in image ? image.url : null;
        if (!isSafeImageUrl(imageUrl)) throw new ProviderError("Respons fal.ai tidak berisi gambar yang valid.");
        return { imageUrl };
      });
    },
  };
}

export function getTryOnProvider(): TryOnProvider {
  const apiUrl = process.env.TRYON_API_URL?.trim();
  const apiKey = process.env.TRYON_API_KEY?.trim();
  if (apiUrl) return createCustomProvider(apiUrl, apiKey);
  if (apiKey) return createFalProvider(apiKey);
  throw new ProviderError("Server try-on belum dikonfigurasi. Isi TRYON_API_KEY atau TRYON_API_URL di .env.local.");
}
