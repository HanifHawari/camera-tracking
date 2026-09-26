# 1. Elemen antarmuka

| Elemen | Fungsi |
| --- | --- |
| Header dan status sesi | Menampilkan nama aplikasi, status belum dimulai/aktif/memproses/dijeda, dan waktu sejak sesi dimulai. |
| Kamera Asli | Menampilkan video dari kamera perangkat. Browser meminta izin saat kamera dibuka. |
| Cermin aktif/mati | Membalik tampilan kamera dan hasil try-on secara horizontal. Ini hanya mengubah tampilan di halaman. |
| Matikan/Hidupkan kamera | Menghentikan atau membuka kembali stream kamera. Mematikan kamera juga menghentikan sesi try-on yang sedang aktif. |
| Hasil Try-On | Menampilkan video hasil Decart atau gambar hasil provider alternatif, beserta status memuat dan kesalahan bila ada. |
| Pilih baju Anda | Menerima foto JPG/PNG tampak depan atau belakang hingga 5 MB melalui pilih file atau drag-and-drop. Tersedia tiga contoh dengan pilihan Depan dan Belakang; sisi yang dipilih dipakai sebagai foto referensi try-on. |
| Status kesiapan | Tombol Generate aktif setelah kamera, foto baju, dan provider siap. Jika provider belum siap, pesan ditampilkan di bawah tombol. |
| Generate Try-On / Jeda sesi | Memulai atau menghentikan sesi. Generate baru tersedia setelah kamera, foto baju, dan provider siap. |
| Pemberitahuan data | Menjelaskan bahwa video/foto dikirim ke penyedia AI saat sesi dimulai. |

Pada layar lebar, kamera dan hasil try-on berada di kiri, sedangkan katalog baju serta tombol sesi berada di kanan. Pada layar kecil, katalog tampil lebih dulu. Antarmuka menggunakan latar gelap dengan aksen maroon dan abu-abu sesuai referensi desain Stitch.


# 2. Jalur utama: Decart realtime

1. Saat halaman dibuka, `GET /api/tryon/config` memeriksa variabel lingkungan di server. Jika `DECART_API_KEY` terisi, mode Decart dipilih. Membuka halaman saja belum memulai sesi Decart.
2. `CameraFeed` membuka kamera melalui `navigator.mediaDevices.getUserMedia`. `GarmentUploader` membaca foto baju yang dipilih menjadi data URL.
3. Setelah **Generate Try-On** ditekan, browser meminta token sementara ke `POST /api/tryon/decart-token`. Route Handler ini menggunakan API key permanen di server, memeriksa origin permintaan, dan membuat token khusus model `lucy-vton-3.5`. Token berlaku 60 detik untuk memulai koneksi; satu sesi dibatasi maksimal 120 detik.
4. `DecartSession` memakai token sementara tersebut untuk menghubungkan stream kamera dan foto baju ke Decart melalui SDK realtime. Video hasil diterima sebagai stream dan ditampilkan di panel kanan.
5. **Jeda sesi**, **Matikan kamera**, mengganti baju, atau menutup halaman akan mengakhiri koneksi yang aktif. Kamera juga dilepas saat dimatikan atau komponen ditutup.

Kredit Decart digunakan selama generasi video aktif. Periksa tarif dan saldo terbaru di [halaman harga Decart](https://docs.platform.decart.ai/getting-started/pricing) serta dashboard akun Anda. Tombol cermin tidak memulai permintaan AI baru.


# 3. Konfigurasi provider

| Variabel | Dipakai untuk | Prioritas |
| --- | --- | --- |
| `DECART_API_KEY` | Decart Lucy VTON 3.5 realtime. API key permanen hanya dibaca di server. | Tertinggi; jika terisi, mode Decart dipilih. |

# 4. Tech stack

| Teknologi | Penggunaan |
| --- | --- |
| Next.js 14, App Router | Halaman aplikasi dan Route Handler API di server. |
| React 18 + TypeScript strict | Komponen antarmuka, state lokal, dan tipe data. |
| Tailwind CSS 3 + CSS | Tata letak responsif, warna, mode gelap, dan animasi sederhana. |
| Zustand 4 | Status sesi, kamera, foto baju, hasil, dan pesan kesalahan. |
| Web Media API + Canvas | Mengakses kamera, mengelola stream, dan mengambil frame untuk mode gambar. |
| `@decartai/sdk` 0.2.2 | Token sementara dan koneksi video realtime Decart. |
| `@fal-ai/client` | Provider alternatif untuk try-on berbasis gambar. |
| Vitest 2 | Tes unit untuk capture frame, provider, dan route token. |

# 5. Struktur proyek

```text
app/page.tsx                         Halaman utama dan pengendali sesi
app/api/tryon/config/route.ts       Pemilihan mode provider
app/api/tryon/decart-token/route.ts Pembuatan token sementara Decart
app/api/tryon/route.ts              Proxy mode gambar
components/CameraFeed.tsx           Kamera dan kontrol stream
components/DecartSession.tsx        Koneksi realtime Decart
components/ResultCamera.tsx         Tampilan video/gambar hasil
components/GarmentUploader.tsx      Upload dan contoh baju
components/GenerateButton.tsx       Tombol mulai/jeda
components/StatusBar.tsx            Status dan timer sesi
lib/captureFrame.ts                 Pengambilan frame kamera
lib/tryonProvider.ts                Integrasi provider mode gambar
store/useSessionStore.ts            State sesi bersama
public/samples/                    Gambar baju contoh
```

# 6. Perintah pengembangan

```bash
npm run dev        # Server pengembangan
npm run typecheck  # Pemeriksaan TypeScript
npm test           # Tes unit
npm run build      # Build produksi
npm run start      # Menjalankan build produksi
```
