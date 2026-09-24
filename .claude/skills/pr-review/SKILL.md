---
name: pr-review
description: Prüft einen Pull Request gegen sein Issue, bevor ein Mensch ihn
  reviewt. Verwenden, nachdem ein Ticket mit /ticket umgesetzt wurde.
argument-hint: "<PR-Nummer>"
---

# PR prüfen

PR: $ARGUMENTS (Repo `SnaikeOrg/tactics-prototype`)

Du prüfst, du änderst nichts. Kein Code, keine Tests, keine Commits, kein
Push. Du mergst nie und reichst kein Approve und kein Request Changes ein.
Das einzige, was du schreibst, ist ein Kommentar im PR.

Maßstab sind das Issue, `docs/RULES.md`, `CLAUDE.md` und
`.claude/skills/ticket/SKILL.md`. Was `/ticket` erlaubt, ist kein Befund.

## Vorbereitung

- PR lesen (`pull_request_read`): Head-SHA, Body, Dateien. Das Issue aus
  `Closes #N` lesen (`issue_read`). Fehlt `Closes #N`: Befund in Punkt 1,
  weiter mit dem, was prüfbar ist.
- Arbeitsverzeichnis muss sauber sein (`git status --porcelain` leer), sonst
  anhalten. Aktuellen Branch merken.
- `git fetch origin main pull/<PR>/head:pr-<PR>`
- Commits des PRs: `git rev-list --reverse --no-merges origin/main..pr-<PR>`.
  Der erste Eintrag ist der Test-Commit.
- Am Ende immer zum gemerkten Branch zurück und `pr-<PR>` löschen, auch wenn
  eine Prüfung abbricht.

## Prüfpunkte

Jeder Punkt endet mit genau einem Status:

- **ok**
- **Befund**: jeweils mit Datei:Zeile und einem Satz, was abweicht
- **nicht prüfbar**: mit Grund, zum Beispiel wenn ein Befehl nicht lief.
  Nie stillschweigend „ok“.

### 1. Abnahme

- Jeder Abnahmepunkt des Issues hat genau einen Test, dessen Name dem
  Wortlaut des Punkts entspricht. Mehrere `expect` in einem Test sind erlaubt.
- Ausnahme: Ein Abnahmepunkt, den „Nicht Teil“ ausdrücklich ausschliesst,
  hat keinen Test und ist im PR-Body so ausgewiesen.
- Eingaben und Erwartungswerte im Test sind identisch mit dem Issue:
  gleiche Zahlen, gleiche Einheiten, gleiche IDs.
- Die Zuordnung im PR-Body stimmt mit den tatsächlichen Tests überein.

### 2. Test-first

Die Ausgabe im PR-Text zählt nicht. Selbst ausführen.

- Der Test-Commit enthält nur Testdateien und Stubs. Ein Stub ist eine
  Funktion, deren Rumpf nur `throw new Error("not implemented")` ist, plus
  der Export in `index.js`. Jede andere Logik im Test-Commit ist ein Befund.
- Test-Commit auschecken (`git checkout --detach <sha>`), `pnpm install
--frozen-lockfile`, `pnpm test`. Jeder neue Test muss fehlschlagen, und
  zwar an einer Assertion oder an „not implemented“. Ein Import- oder
  Syntaxfehler, der die ganze Datei scheitern lässt, ist ein Befund. Ein
  neuer Test, der schon grün ist, ist ein Befund.
- Die Tests sind danach unverändert:
  `git diff <test-commit> pr-<PR> -- '*.test.js'` zeigt keine Änderung an
  den Tests aus dem Test-Commit. Jede Änderung an Name, Eingabe oder
  Erwartungswert ist ein Befund.

### 3. Checks

- Head auschecken, `pnpm install --frozen-lockfile`, dann `pnpm test`,
  `pnpm typecheck` und `pnpm lint`. Alle grün.
- Keine neuen `eslint-disable`, `@ts-ignore`, `@ts-expect-error` (ausser in
  Tests, die einen Fehler absichtlich provozieren), `any` oder `*` in
  JSDoc-Typen.
- Keine neuen Abhängigkeiten in `package.json` oder `pnpm-lock.yaml`.

### 4. Umfang

- `git diff --stat origin/main...pr-<PR>`. Jede Datei passt zu `Aufgabe`
  und `Bezug`. Mehr als fünf Dateien: Ist jede zusätzliche im PR-Body
  begründet?
- Nichts aus „Nicht Teil“ ist umgesetzt, auch nicht als Vorbereitung
  (ungenutzte Parameter, leere Zweige, TODOs dafür).
- Keine Änderung an `docs/RULES.md` und keine Balancing-Zahlen in
  `packages/core/data`, ausser das Issue verlangt es.

### 5. Hartkodierung

- Alle Zahlen aus den neuen Tests sammeln, ausser 0 und 1.
- In den hinzugefügten Zeilen der Implementierung (`git diff
origin/main...pr-<PR> -- 'packages/*/src/**'`) danach suchen.
- Jeder Treffer ist ein Befund, ausser er ist
  - ein Wert in `packages/core/data` oder
  - eine benannte Regelkonstante mit §-Kommentar, deren Wert in genau diesem
    Abschnitt von RULES.md steht.
- Ebenso ein Befund: eine Verzweigung auf konkrete Test-IDs oder
  -Koordinaten, etwa `if (unitId === 2)`.

### 6. Architektur

- Keine Imports aus `web` oder `sim` in `packages/core`, auch nicht über
  relative Pfade.
- Kein `Math.random`, `Date.now` oder `new Date` in `core`. Zufall nur über
  den injizierten Generator.
- Nur benannte Exporte. Neue Dateinamen in kebab-case.

### 7. Regeltreue: Fragen, kein Urteil

Lies die Abschnitte aus `Bezug` und die dort referenzierten Abschnitte. Liste
jede Stelle, an der man den Text anders lesen könnte, als die Implementierung
es tut, jeweils mit

- §-Zitat (wörtlich, kurz),
- Datei:Zeile der Implementierung,
- den beiden Lesarten,
- ob ein Test die Lesart der Implementierung festschreibt.

Nicht entscheiden, welche Lesart richtig ist. Keine Stelle gefunden: „keine
Fragen“. Dieser Punkt hat keinen Status.

## Kommentar

Einen einzigen Kommentar in den PR schreiben (`add_issue_comment`):

```
## /pr-review für <Head-SHA, 7 Zeichen>

| # | Prüfpunkt | Status |
|---|-----------|--------|
| 1 | Abnahme | ok / Befund / nicht prüfbar |
| … | … | … |

### Befunde
- [2] packages/core/tests/x.test.js:14 – …

### Fragen zur Regeltreue
- …
```

Sind Befunde da, fasst eine Zeile über der Tabelle zusammen: „N Befunde,
siehe unten“. Die Zusammenfassung im Chat ist derselbe Text plus der Link
zum Kommentar. Bei einem neuen Head-SHA gibt es einen neuen Kommentar. Alte
Kommentare nicht bearbeiten.
