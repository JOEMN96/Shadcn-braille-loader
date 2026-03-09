import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://braille-loader.dev";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Braille Loader - Accessible Loading Animations for shadcn/ui",
    template: "%s | Braille Loader",
  },
  description:
    "A registry-first, accessible braille loader library for shadcn/ui featuring 19 unique animation variants. Built with React, TypeScript, and Tailwind CSS. Zero dependencies, fully customizable.",
  keywords: [
    "shadcn",
    "shadcn/ui",
    "braille loader",
    "loading animation",
    "react component",
    "typescript",
    "tailwind css",
    "accessible",
    "a11y",
    "loading indicator",
    "animation",
    "ui component",
    "react loader",
    "shadcn registry",
  ],
  authors: [{ name: "Braille Loader Contributors" }],
  creator: "Braille Loader",
  publisher: "Braille Loader",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Braille Loader",
    title: "Braille Loader - Accessible Loading Animations for shadcn/ui",
    description:
      "A registry-first, accessible braille loader library for shadcn/ui featuring 19 unique animation variants. Zero dependencies, fully customizable.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Braille Loader - 19 Accessible Loading Animations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Braille Loader - Accessible Loading Animations for shadcn/ui",
    description:
      "A registry-first, accessible braille loader library featuring 19 unique animation variants.",
    images: ["/og-image.png"],
    creator: "@brailleloader",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "technology",
  classification: "UI Component Library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
