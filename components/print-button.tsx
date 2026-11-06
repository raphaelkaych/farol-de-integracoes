"use client";

export function PrintButton() {
  return <button type="button" className="button button-primary print-button" onClick={() => window.print()}>Imprimir resumo</button>;
}
