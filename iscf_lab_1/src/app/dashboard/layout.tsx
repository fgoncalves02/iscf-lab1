export default function Layout({ children }: { children: React.ReactNode }) {
    return (
      <div>
        <header>Meu Header</header>
        <main>{children}</main>
        <footer>Meu Footer</footer>
      </div>
    );
  }