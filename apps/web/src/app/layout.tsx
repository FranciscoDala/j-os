import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
            </head>
            <body style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                {children}
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
