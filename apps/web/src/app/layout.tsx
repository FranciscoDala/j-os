export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ margin: 0, background: "#f5f8ff" }}>{children}</body>
    </html>
  );
}
