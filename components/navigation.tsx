"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { casePath, projects } from "../lib/project-index";
import { github } from "../lib/portfolio-meta";

const nav = [
  { id: "inicio", label: "Início", href: "/" },
  { id: "projetos", label: "Projetos", href: "/projetos" },
  { id: "engenharia", label: "Engenharia", href: "/#engenharia" },
  { id: "trajetoria", label: "Trajetória", href: "/#trajetoria" },
  { id: "contato", label: "Contato", href: "/#contato" },
] as const;

const commands = [
  ...nav,
  ...projects.map((project) => ({ id: project.slug, label: project.name, href: casePath(project.slug), keywords: project.stack.join(" ") })),
  { id: "github", label: "Perfil do GitHub", href: github },
];

function normalized(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function Navigation() {
  const [menu, setMenu] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState("inicio");
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement>(null);

  function openSearch() {
    if (dialog.current?.open) return;
    setQuery("");
    setMenu(false);
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.showModal();
    input.current?.focus();
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
      if (event.key === "Escape" && dialog.current?.open) {
        event.preventDefault();
        dialog.current.close();
        return;
      }
      if (event.key === "Escape") {
        if (menuButton.current?.getAttribute("aria-expanded") === "true") menuButton.current.focus();
        setMenu(false);
      }
    }
    document.addEventListener("keydown", shortcut, true);
    setReady(true);
    return () => document.removeEventListener("keydown", shortcut, true);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;
    const anchors = nav.map(({ id }) => document.getElementById(id)).filter((item): item is HTMLElement => !!item);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-20% 0px -58% 0px" });
    for (const anchor of anchors) observer.observe(anchor);
    return () => observer.disconnect();
  }, [pathname]);

  const items = commands.filter((command) => normalized(command.label + ("keywords" in command ? " " + command.keywords : "")).includes(normalized(query.trim())));
  const isLab = pathname.startsWith("/projetos") || ["/farol", "/qualitygate", "/ledgerflow", "/traceatlas"].includes(pathname) || pathname.startsWith("/demos/");
  const current = isLab ? "projetos" : pathname === "/trajetoria" ? "trajetoria" : active;

  return (
    <>
      <nav id="portfolio-nav" className="site-nav" data-open={menu} aria-label="Navegação principal">
        {nav.map((item) => (
          <a key={item.id} href={item.href} aria-current={current === item.id ? "location" : undefined}
            onClick={() => { setMenu(false); setActive(item.id); }}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <button type="button" className="icon-button command-trigger" aria-label="Abrir busca rápida" onClick={openSearch} disabled={!ready}>
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.2" /><path d="m13 13 4 4" /></svg>
          <kbd>Ctrl K</kbd>
        </button>
        <a className="nav-github" href={github}>GitHub <span aria-hidden="true">↗</span></a>
        <button type="button" ref={menuButton} className="icon-button mobile-toggle" aria-controls="portfolio-nav"
          aria-expanded={menu} onClick={() => setMenu(!menu)} aria-label={menu ? "Fechar menu" : "Abrir menu"} disabled={!ready}>
          <svg viewBox="0 0 20 20" width="19" height="19" aria-hidden="true">
            {menu ? <path d="m4 4 12 12M4 16 16 4" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
          </svg>
        </button>
      </div>
      <dialog className="command-dialog" ref={dialog} aria-labelledby="command-title"
        onClose={() => previousFocus.current?.focus({ preventScroll: true })}>
        <div className="command-head">
          <h2 id="command-title">Busca rápida</h2>
          <button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label="Fechar busca">Esc</button>
        </div>
        <label className="sr-only" htmlFor="command-query">Buscar projeto ou tecnologia</label>
        <input id="command-query" ref={input} type="search" placeholder="Projeto, seção ou tecnologia…" value={query}
          onChange={(event) => setQuery(event.target.value)} />
        <ul className="command-list">
          {items.map((command) => <li key={command.id}><a href={command.href} onClick={() => dialog.current?.close()}>{command.label}<span aria-hidden="true">↗</span></a></li>)}
        </ul>
        {!items.length && <p className="lab-meta" role="status">Nenhum resultado para esta busca.</p>}
      </dialog>
    </>
  );
}
