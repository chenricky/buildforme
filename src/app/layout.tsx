import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BuildForMe — Custom Furniture Marketplace",
  description:
    "Connect with skilled artisans to bring your custom furniture vision to life. Post a project or bid on unique woodworking commissions.",
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
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <AppProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-stone-200 bg-white py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-stone-500">
              © {new Date().getFullYear()} BuildForMe — Crafted with care for
              makers and dreamers. System is designed in Seattle
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}