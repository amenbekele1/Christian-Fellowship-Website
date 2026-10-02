import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "@/components/ui/toaster";
import { DisablePinchZoom } from "@/components/layout/DisablePinchZoom";

// Self-hosted by Next.js and preloaded: no render-blocking request to Google
// before the first paint (the old CSS @import delayed every page load).
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const lato = Lato({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1C0F07",
};

export const metadata: Metadata = {
  title: {
    default: "WECF · Warsaw Ethiopian Christian Fellowship",
    template: "%s | WECF",
  },
  description:
    "Warsaw Ethiopian Christian Fellowship (WECF) — a Christ-centred community in Warsaw. Join us every Saturday at 18:00 at Naddnieprzańska 7 for worship, the Word and fellowship.",
  keywords: ["Ethiopian church Warsaw", "WECF", "Christian fellowship Warsaw", "Ethiopian Christian", "worship", "Bible study"],
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://wetcf.com"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WECF",
    startupImage: "/icons/icon-512x512.png",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          <DisablePinchZoom />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
