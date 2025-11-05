import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SimpleAuthProvider } from "@/contexts/SimpleAuthContext-Fixed";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import { SonnerProvider } from "@/components/SonnerProvider";
import { ErrorHandler } from "@/components/ErrorHandler";
import { OfflineNotifier } from "@/components/layout/OfflineNotifier";

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
  title: "JUGA - Sistema de Gestão Empresarial",
  description: "Sistema moderno de gestão empresarial - JUGA",
  icons: {
    icon:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" ry="12" fill="%231a2234"/><path d="M18 42c0-9.94 8.06-18 18-18h10v6H36c-6.63 0-12 5.37-12 12v6h-6v-6z" fill="%23ffffff"/><circle cx="44" cy="22" r="6" fill="%230EA5E9"/></svg>'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SimpleAuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <ErrorHandler />
            <OfflineNotifier />
            <Toaster />
            <SonnerProvider />
          </SimpleAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
