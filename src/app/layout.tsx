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

// [css width, css height, device pixel ratio] — portrait iPhones, SE → 17 Pro Max.
const IOS_DEVICES: [number, number, number][] = [
  [440, 956, 3], [402, 874, 3], [420, 912, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3],
  [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2], [320, 568, 2],
];
const IOS_SPLASH = IOS_DEVICES.map(([w, h, d]) => ({
  url: `/splash/apple-splash-${w * d}x${h * d}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)`,
}));

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
    // iOS ignores the manifest splash and shows a black screen unless it
    // finds an exact-size startup image for the device (public/splash/).
    startupImage: IOS_SPLASH,
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
