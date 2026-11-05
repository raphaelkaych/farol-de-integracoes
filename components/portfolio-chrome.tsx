export const github = "https://github.com/raphaelkaych";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/" aria-label="Raphael Kaych, início">
          <span className="monogram" aria-hidden="true">rk<span>.</span></span>
          <span>Raphael Kaych</span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="/#projetos">Projetos</a>
          <a href="/#trajetoria">Trajetória</a>
          <a className="nav-github" href={github}>GitHub <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <span>Raphael Kaych <span aria-hidden="true">·</span> Portfólio profissional</span>
        <a href={github}>GitHub <span aria-hidden="true">↗</span></a>
      </div>
    </footer>
  );
}
