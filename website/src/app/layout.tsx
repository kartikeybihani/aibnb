import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AIbnb - Book your next vacation",
  description:
    "Tell me where, how long, who is coming and your vibe. AI-powered travel planning that creates your perfect vacation in seconds.",
  keywords: "travel, vacation, AI, planning, booking, itinerary",
  authors: [{ name: "AIbnb" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "AIbnb - Book your next vacation",
    description:
      "AI-powered travel planning that creates your perfect vacation in seconds.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIbnb - Book your next vacation",
    description:
      "AI-powered travel planning that creates your perfect vacation in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
