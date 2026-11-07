"use client";

import { useBrowserReady } from "./use-browser-ready";

export function PrintButton() {
  const ready = useBrowserReady();
  return <button type="button" className="button button-primary print-button" disabled={!ready} onClick={() => window.print()}>Imprimir ou salvar em PDF</button>;
}
