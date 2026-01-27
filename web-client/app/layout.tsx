import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";


const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UNITED NAMELESS - Community Companion",
  description: "Advanced economy, leveling, and security bot for your Discord community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} font-sans antialiased bg-black text-white selection:bg-purple-500/30`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
