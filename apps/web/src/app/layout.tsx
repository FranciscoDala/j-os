import "./globals.css";
import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { RealtimeProvider } from "@/components/dashboard/RealtimeProvider";
import { SearchProvider } from "@/features/search/context";
import { EmpresaProvider } from "@/components/dashboard/empresaContext";

const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"],
    variable: "--font-dm-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "Kitanda",
        template: "%s | Kitanda",
    },
    description: "Sistema de gestão Kitanda - Restaurante, caixa, mesas e vendas",
    manifest: "/site.webmanifest",
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/android-chrome-192x192.jpg", sizes: "192x192", type: "image/jpg" },
            { url: "/android-chrome-512x512.jpg", sizes: "512x512", type: "image/jpg" },
        ],
        apple: [
            { url: "/apple-touch-icon.jpg", sizes: "180x180", type: "image/jpg" },
        ],
        shortcut: "/favicon.ico",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Kitanda",
    },
    applicationName: "Kitanda",
};

export const viewport: Viewport = {
    themeColor: "#2F4A8A",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt" className={dmSans.variable}>
            <body className={`${dmSans.className} antialiased`}>
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
                            fontFamily: "var(--font-dm-sans), sans-serif",
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
