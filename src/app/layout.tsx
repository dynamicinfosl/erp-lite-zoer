
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConditionalAuthProvider } from "@/components/auth/ConditionalAuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import ZoerCopilot from "@/components/ZoerCopilot";
import { ErrorHandler } from "@/components/ErrorHandler";

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
  title: "ERP Lite - Gestão de Bebidas",
  description: "Sistema completo de gestão para depósitos de bebidas",
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
          <ConditionalAuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <ErrorHandler />
            <Toaster />
            {/* Renderizar ZoerCopilot apenas quando habilitado por envs */}
            {process.env.NEXT_PUBLIC_ENABLE_ZOER === 'true' && <ZoerCopilot />}
          </ConditionalAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
