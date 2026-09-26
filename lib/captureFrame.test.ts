import { afterEach, describe, expect, it, vi } from "vitest";
import { captureFrame } from "./captureFrame";

describe("captureFrame", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resizes the longest edge to 768px and exports JPEG at 0.8 quality", () => {
    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => "data:image/jpeg;base64,AAAA");
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toDataURL };
    vi.stubGlobal("document", { createElement: () => canvas });
    const video = { videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement;

    expect(captureFrame(video)).toBe("data:image/jpeg;base64,AAAA");
    expect(canvas.width).toBe(768);
    expect(canvas.height).toBe(432);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 768, 432);
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.8);
  });

  it("rejects a camera frame before video metadata is ready", () => {
    expect(() => captureFrame({ videoWidth: 0, videoHeight: 0 } as HTMLVideoElement)).toThrow("Kamera belum siap");
  });
});
