import { Navigation } from "./navigation";
import { github } from "../lib/portfolio-meta";

export { github };

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/" aria-label="Raphael Kaych, início">
          <span className="monogram" aria-hidden="true">RK</span>
          <span>Raphael Kaych</span>
        </a>
        <Navigation />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <span>Raphael Kaych <span aria-hidden="true">/</span> Portfólio de engenharia</span>
        <a href={github}>GitHub <span aria-hidden="true">↗</span></a>
      </div>
    </footer>
  );
}
