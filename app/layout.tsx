import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HUMAN OS v2.0 — Digital Twin",
  description: "Your biological performance operating system",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050a0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#050a0e] text-white antialiased">
        <div className="scanline-overlay" />
        {children}
      </body>
    </html>
  );
}
