import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LoaderProvider } from "@/components/LoaderProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CheckedIn — Event Attendance",
  description: "QR attendance system for Admin, Faculty, and Organizations",
  icons: {
    icon: "/logos/logo.png",
    apple: "/logos/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LoaderProvider>{children}</LoaderProvider>
      </body>
    </html>
  );
}
