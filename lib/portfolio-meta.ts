import type { Metadata } from "next";

export const siteUrl = "https://raphael-kaych.raphaelkaych.workers.dev";
export const github = "https://github.com/raphaelkaych";
export const siteRepository = github + "/farol-de-integracoes";
export const vindexPath = "/trajetoria#vindex-fiscal";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: {
      title: title + " | Raphael Kaych", description, url: path, locale: "pt_BR",
      type: "website", images: [{ url: "/compartilhamento.png", width: 1200, height: 630, alt: "Raphael Kaych. Software que passa pelo teste: uma requisição atravessa interface, API e dados, com respostas 201 e 403." }],
    },
  };
}
