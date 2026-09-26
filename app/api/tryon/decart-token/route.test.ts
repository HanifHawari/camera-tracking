import { afterEach, describe, expect, it, vi } from "vitest";

const createToken = vi.hoisted(() => vi.fn());
vi.mock("@decartai/sdk", () => ({
  createDecartClient: () => ({ tokens: { create: createToken } }),
}));

import { POST } from "./route";

const originalKey = process.env.DECART_API_KEY;
const endpoint = "http://localhost:3000/api/tryon/decart-token";

afterEach(() => {
  if (originalKey === undefined) delete process.env.DECART_API_KEY;
  else process.env.DECART_API_KEY = originalKey;
  createToken.mockReset();
});

describe("Decart token route", () => {
  it("returns a short-lived, model-scoped token without exposing the permanent key", async () => {
    process.env.DECART_API_KEY = "permanent-secret";
    createToken.mockResolvedValue({ apiKey: "temporary-token", expiresAt: "2026-09-25T10:00:00Z" });

    const response = await POST(new Request(endpoint, { method: "POST", headers: { origin: "http://localhost:3000" } }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ apiKey: "temporary-token", expiresAt: "2026-09-25T10:00:00Z" });
    expect(createToken).toHaveBeenCalledWith({
      expiresIn: 60,
      allowedModels: ["lucy-vton-3.5"],
      allowedOrigins: ["http://localhost:3000"],
      constraints: { realtime: { maxSessionDuration: 120 } },
    });
  });

  it("rejects requests from another origin", async () => {
    process.env.DECART_API_KEY = "permanent-secret";
    const response = await POST(new Request(endpoint, { method: "POST", headers: { origin: "https://other.example" } }));
    expect(response.status).toBe(403);
    expect(createToken).not.toHaveBeenCalled();
  });

  it("reports missing configuration without creating a token", async () => {
    delete process.env.DECART_API_KEY;
    const response = await POST(new Request(endpoint, { method: "POST", headers: { origin: "http://localhost:3000" } }));
    expect(response.status).toBe(503);
    expect(createToken).not.toHaveBeenCalled();
  });
});
