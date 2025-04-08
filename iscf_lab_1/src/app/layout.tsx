export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ backgroundColor: "black", color: "white", margin: 0, padding: 0 }}>
        <main>{children}</main>
      </body>
    </html>
  );
}
