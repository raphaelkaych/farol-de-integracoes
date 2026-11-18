export default function NotFound() {
  return (
    <main id="conteudo" tabIndex={-1} className="shell inner-page not-found">
      <div className="page-intro">
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1>Página não encontrada</h1>
        <p>Este endereço não existe ou mudou. Os estudos de caso e as demonstrações continuam no catálogo.</p>
        <div className="links">
          <a className="button button-primary" href="/projetos">Ver projetos</a>
          <a className="button button-outline" href="/">Voltar ao início</a>
        </div>
      </div>
    </main>
  );
}
