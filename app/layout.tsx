import type { Metadata, Viewport } from "next";
import { Outfit, Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import PushRegistrar from "@/components/PushRegistrar";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
  preload: true,
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
  preload: false,
});

const APP_URL = "https://momo-rust-nu.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Momo — Acompanhamento de Mounjaro",
    template: "%s · Momo",
  },
  description:
    "Acompanhe suas doses, peso, dieta e estoque de Mounjaro em um só lugar. O app completo para quem usa semaglutida e tirzepatida.",
  keywords: [
    "Mounjaro",
    "tirzepatida",
    "semaglutida",
    "controle de doses",
    "acompanhamento Mounjaro",
    "diário Mounjaro",
    "emagrecimento",
    "saúde",
  ],
  manifest: "/manifest.json",
  applicationName: "Momo",
  authors: [{ name: "Momo" }],
  creator: "Momo",
  robots: { index: true, follow: true },
  alternates: { canonical: APP_URL },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: "Momo",
    title: "Momo — Acompanhamento de Mounjaro",
    description:
      "Acompanhe suas doses, peso, dieta e estoque de Mounjaro em um só lugar.",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Momo App",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Momo — Acompanhamento de Mounjaro",
    description:
      "Acompanhe suas doses, peso, dieta e estoque de Mounjaro em um só lugar.",
    images: ["/icons/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6500",
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
    <html lang="pt-BR" className={`${outfit.variable} ${syne.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('momo-theme');if(t==='dark')document.documentElement.classList.add('dark');})();`,
          }}
        />
      </head>
      <body className={`${outfit.className} font-sans bg-bg`} suppressHydrationWarning>
        <PushRegistrar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
