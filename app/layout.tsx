import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Momo",
    template: "%s · Momo",
  },
  description:
    "Acompanhe suas doses, peso, dieta e estoque de Mounjaro em um só lugar.",
  manifest: "/manifest.json",
  applicationName: "Momo",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c4d2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <body className={`${dmSans.className} font-sans bg-[#f2f2f7] w-full max-w-full overflow-x-hidden`} style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
