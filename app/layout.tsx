import type { Metadata } from "next";
import { Caveat, Cormorant_Garamond, Lora } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  style: ["normal", "italic"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Morning Dedication Letter",
  description: "A letter folded into a sunrise.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${lora.variable} ${cormorantGaramond.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
