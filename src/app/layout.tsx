import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreditLyft Portal",
  description: "Client portal and admin dashboard for credit repair and funding readiness",
  manifest: "/manifest.json",
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="font-sans antialiased min-h-screen bg-surface text-slate-100"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
