import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://biotrace-mvp.vercel.app'),
  title: "Mago — Satellite-Verified Agroecology Certification",
  description: "Mago connects smallholder cooperatives to ESG buyers through AI-powered satellite APS scoring, EUDR compliance, and QR-verified digital certificates.",
  openGraph: {
    title: "Mago — Satellite-Verified Agroecology Certification",
    description: "Satellite-verified agroecology certification for smallholder cooperatives.",
    images: [{ url: '/mago-logo.png', width: 1800, height: 820 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
