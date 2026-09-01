import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOR STORE // price signal",
  description: "Compare grocery price signals across stores, inspect provenance, and choose where to continue.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
