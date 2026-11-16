import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowstate Supply — Thoughtful fixtures. Better spaces.",
  description:
    "Beautifully made plumbing and bathroom essentials, selected for everyday living. Shop faucets, basins, showers, and more.",
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
