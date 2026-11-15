import type { Metadata } from "next";
import { Geist, Geist_Mono, VT323, Silkscreen } from "next/font/google";
import SpaceSky from "@/app/components/SpaceSky";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "nloreee.it — Orbital Failover",
  description: "Personal website of Lollo. Currently offline or unreachable.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} ${silkscreen.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#04050d] text-[#e8eaff]">
        <SpaceSky />
        {children}
      </body>
    </html>
  );
}
