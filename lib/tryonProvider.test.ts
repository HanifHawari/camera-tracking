import { describe, expect, it, vi } from "vitest";
import { createCustomProvider, isSafeImageUrl, withRetry } from "./tryonProvider";
import type { TryOnRequest } from "./types";

const input: TryOnRequest = {
  personImage: "data:image/jpeg;base64,AAAA",
  garmentImage: "data:image/png;base64,AAAA",
};

describe("tryonProvider", () => {
  it("passes images and optional key only to the configured backend", async () => {
    const fetcher: typeof fetch = vi.fn(async () => Response.json({ imageUrl: "https://example.com/result.png" }));
    const provider = createCustomProvider("https://example.com/tryon", "server-secret", fetcher);

    await expect(provider.generate(input)).resolves.toEqual({ imageUrl: "https://example.com/result.png" });
    expect(fetcher).toHaveBeenCalledWith("https://example.com/tryon", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer server-secret" },
      body: JSON.stringify(input),
    }));
  });

  it("retries a temporary provider failure at most twice", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValue("done");
    await expect(withRetry(operation)).resolves.toBe("done");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("rejects unsafe or malformed image URLs", () => {
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeImageUrl("http://example.com/image.png")).toBe(false);
    expect(isSafeImageUrl("https://example.com/image.png")).toBe(true);
  });
});
