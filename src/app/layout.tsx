import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Versus - Compare and Decide",
  description: "Create comparisons to help you make better decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const AIStatusOverlay = dynamic(() => import('@/components/AIStatusOverlay'), { ssr: false });
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        <header className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6">
          <a href="/" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">Versus</a>
          <nav className="flex items-center space-x-4">
            <a href="/comparisons" className="text-gray-300 hover:text-white px-3 py-2 rounded transition-colors">
              Comparisons
            </a>
            <a href="/ai-settings" className="text-gray-300 hover:text-white px-3 py-2 rounded transition-colors">
              AI Settings
            </a>
          </nav>
        </header>
        <div className="min-h-screen bg-gray-900">
          {children}
        </div>
        <AIStatusOverlay />
      </body>
    </html>
  );
}