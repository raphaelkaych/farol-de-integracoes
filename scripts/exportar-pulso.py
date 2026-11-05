"""Gera os recortes do site com o SQL e a base do repositório Pulso da Operação."""

import argparse
import json
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", type=Path, help="Caminho local para pulso-operacao")
    args = parser.parse_args()
    repo = args.repo.resolve()
    sys.path.insert(0, str(repo))
    from relatorio import calcular

    recortes = [
        ("2026-05-06 12:00", "06 mai 2026 · 12h00"),
        ("2026-05-08 18:00", "08 mai 2026 · 18h00"),
        ("2026-05-08 20:00", "08 mai 2026 · 20h00"),
    ]
    saida = [
        {"reference": data, "label": rotulo, "data": [dict(linha) for linha in calcular(repo / "chamados.csv", data)]}
        for data, rotulo in recortes
    ]
    destino = Path(__file__).resolve().parents[1] / "lib" / "pulso-snapshots.json"
    destino.write_text(json.dumps(saida, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
