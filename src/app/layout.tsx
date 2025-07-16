import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { runMigrations } from "@/lib/db";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mood Tracker",
  description: "Track your mood and mental wellness",
};

// Initialize database on app start
if (typeof window === "undefined") {
  runMigrations();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
