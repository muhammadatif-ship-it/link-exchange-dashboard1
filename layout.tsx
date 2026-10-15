import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Link Exchange Hub", description: "Private link collaboration tracker" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}