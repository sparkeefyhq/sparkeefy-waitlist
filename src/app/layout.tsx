import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sfProDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-SemiboldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-HeavyItalic.woff2",
      weight: "900",
      style: "italic",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-BlackItalic.woff2",
      weight: "900",
      style: "italic",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-UltralightItalic.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/fonts/sf-pro-display/SFProDisplay-ThinItalic.woff2",
      weight: "100",
      style: "italic",
    },
  ],
  variable: "--font-sf-pro-display",
  display: "swap",
});

const retroVintage = localFont({
  src: "../../public/fonts/retro-vintage/RetroVintage-LV3ZG.woff",
  variable: "--font-retro-vintage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sparkeefy",
  description: "Caring for your loved ones",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sfProDisplay.variable} ${retroVintage.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
