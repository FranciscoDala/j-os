import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { RealtimeProvider } from "@/components/dashboard/RealtimeProvider";
import { SearchProvider } from "@/features/search/context";
import { EmpresaProvider } from "@/components/dashboard/empresaContext";

export const metadata: Metadata = {
    title: {
        default: "J-OS - Restaurante",
        template: "%s | J-OS",
    },
    description: "Sistema de gestão J-OS - Restaurante, caixa, mesas e vendas",
    manifest: "/site.webmanifest",
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "J-OS",
    },
    applicationName: "J-OS",
};

export const viewport: Viewport = {
    themeColor: "#2F4A8A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
            </head>
            <body style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <EmpresaProvider>
                    <SearchProvider>
                        <RealtimeProvider>
                            {children}
                        </RealtimeProvider>
                    </SearchProvider>
                </EmpresaProvider>
                <Toaster
                    position="top-right"
                    richColors
                    closeButton={false}
                    toastOptions={{
                        style: {
                            fontFamily: '"Zalando Sans Expanded", sans-serif',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '600',
                        },
                        duration: 3500,
                    }}
                />
            </body>
        </html>
    );
}
