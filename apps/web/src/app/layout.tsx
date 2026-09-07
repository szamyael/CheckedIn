import type { Metadata } from "next";
import { LoaderProvider } from "@/components/LoaderProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider><LoaderProvider>{children}</LoaderProvider></ThemeProvider>
      </body>
    </html>
  );
}
