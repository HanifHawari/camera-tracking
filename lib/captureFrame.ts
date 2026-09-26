export function captureFrame(video: HTMLVideoElement, maxDimension = 768): string {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight) {
    throw new Error("Kamera belum siap. Coba lagi sebentar.");
  }

  const scale = Math.min(1, maxDimension / Math.max(videoWidth, videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(videoWidth * scale);
  canvas.height = Math.round(videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Gagal mengambil gambar dari kamera.");
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}
