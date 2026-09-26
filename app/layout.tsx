import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Try-On",
  description: "Coba pakaian secara virtual melalui kamera Anda.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
