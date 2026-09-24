# CLAUDE.md

Steuerung für Agents. Kurz halten. `docs/RULES.md` ist die Quelle der Wahrheit für Spielregeln.

## Ziel

Wir bauen einen wegwerfbaren Taktik-Prototypen, um Regellogik, Renderer und Simulation schnell voneinander zu trennen. Nichts hier ist produktreif oder auf Dauer angelegt. Falsche Annahmen ersetzen wir, statt den Code zu retten.

## Struktur

```
packages/core   Schicht A — Regellogik, keine Produktionsabhängigkeit
packages/web    Schicht B — Renderer
packages/sim    Headless-Simulator
docs/RULES.md   Spielregeln
docs/DECISIONS.md
```

- `core` darf `web` und `sim` nicht importieren.
- `web` und `sim` dürfen `core` importieren.
- Zufall in `core` nur über einen injizierten, seedbaren Generator. Nie `Math.random()`.

## Befehle

Node 24.21.0 (`.nvmrc`). Immer vom Repo-Root:

| Befehl            | Zweck             |
| ----------------- | ----------------- |
| `pnpm test`       | Tests einmal      |
| `pnpm test:watch` | Tests watch       |
| `pnpm dev`        | Renderer starten  |
| `pnpm lint`       | Lint              |
| `pnpm typecheck`  | TypeScript strict |

Keine Logikänderung ohne grünes `pnpm test` vom Root.

## Konventionen

- TypeScript strict, kein `any`
- Nur benannte Exporte
- Dateinamen in kebab-case

## Arbeitsregeln

- Branch: `feat/`, `fix/` oder `chore/` plus Ticketnummer. Die Ticketnummer ist die GitHub-Issue-Nummer. Ein Feature, ein Branch, ein PR.
- Commit nach jedem grünen `pnpm test`, nicht nach der Sitzung.
- Jede Logikänderung in `core` kommt mit Tests.
- Keine neuen Abhängigkeiten ohne Rückfrage.
- Spielregeln: `docs/RULES.md`. Entscheidungen: `docs/DECISIONS.md` (eine Zeile, Datum, Begründung). Widerspricht der Code den Regeln, gewinnt `RULES.md`.

## Nicht tun

- Balancing-Zahlen nicht eigenmächtig ändern.
- Keine Dateien außerhalb dieses Repos anfassen.
- Keine Secrets committen (`.env`, Keys, Tokens).
