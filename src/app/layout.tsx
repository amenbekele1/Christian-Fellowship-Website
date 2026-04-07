import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "Warsaw Ethiopian Christian Fellowship",
    template: "%s | Warsaw Ethiopian Christian Fellowship",
  },
  description:
    "A Christ-centred community in Warsaw, Poland — worshipping, growing, and serving together. Hebrews 10:24-25.",
  keywords: ["Ethiopian church", "Warsaw", "Christian fellowship", "Ethiopia", "worship"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
