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
Ein PR, dessen Body „Ersetzt #…“ enthält, stammt von `/fix`: Sein
Test-Commit wurde neu aufgebaut. Er wird genauso geprüft wie jeder andere.

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

Nicht entscheiden, welche Lesart richtig ist. Ein Vorschlag gehört in die
vorgeschlagene Handlungsanweisung, nicht hierher. Keine Stelle gefunden: „keine
Fragen“. Dieser Punkt hat keinen Status.

## Kommentar

Einen einzigen Kommentar in den PR schreiben (`add_issue_comment`):

```
## /pr-review für <Head-SHA, 7 Zeichen>

Ergebnis: MERGEBAR / NACHARBEIT / ENTSCHEIDUNG

| # | Prüfpunkt | Status |
|---|-----------|--------|
| 1 | Abnahme | ok / Befund / nicht prüfbar |
| … | … | … |

### Befunde
- [2] packages/core/tests/x.test.js:14 – … (behebbar)

### Fragen zur Regeltreue
- …

### Vorgeschlagene Handlungsanweisung
1. …
```

Sind Befunde da, fasst eine Zeile über der Tabelle zusammen: „N Befunde,
siehe unten“.

Jeder Befund endet mit genau einer Markierung:

- **(behebbar)**: Es gibt genau eine kleinste Änderung, die den Befund
  behebt, sie steht in der Handlungsanweisung, und sie ändert weder
  `docs/RULES.md`, `packages/core/data` noch das Issue. `/fix` setzt sie
  ohne Rückfrage um.
- **(Entscheidung)**: sonst, zum Beispiel wenn mehrere Korrekturen möglich
  sind oder das Issue selbst angepasst werden müsste.

### Ergebnis

Genau ein Wert, geprüft in dieser Reihenfolge:

1. **ENTSCHEIDUNG**: Mindestens eine Frage zur Regeltreue muss vor dem Merge
   geklärt sein (siehe Handlungsanweisung, Schritt 3), oder mindestens ein
   Befund ist mit „(Entscheidung)“ markiert. Gilt auch, wenn es zusätzlich
   behebbare Befunde gibt, weil die Entscheidung die Nacharbeit ändern kann.
2. **NACHARBEIT**: Mindestens ein Punkt hat „Befund“ oder „nicht prüfbar“.
3. **MERGEBAR**: sonst. Fragen, die nach dem Merge geklärt werden können,
   ändern daran nichts.

Das Ergebnis ist eine Einordnung, keine Freigabe durch dich. Gemergt wird nur
nach der Regel in `CLAUDE.md`.

### Vorgeschlagene Handlungsanweisung

Der letzte Abschnitt des Kommentars. Er ist ein Vorschlag an den Menschen,
keine Entscheidung. Du setzt ihn nicht selbst um. Nummerierte Schritte in
dieser Reihenfolge, jeweils nur, wenn es den Fall gibt:

1. **Befunde:** „Nicht mergen.“ Danach je Befund ein Schritt mit Verweis auf
   die Nummer, zum Beispiel „[2] Test-Commit neu aufsetzen, sodass …“. Nenne
   die kleinste Änderung, die den Befund behebt.
2. **Nicht prüfbar:** Was nötig ist, damit der Punkt prüfbar wird, zum
   Beispiel „`pnpm install` lokal wiederholen und `/pr-review` erneut
   starten“.
3. **Fragen zur Regeltreue:** Je Frage ein Schritt. Nenne, welche Lesart der
   Code umsetzt und was die andere Lesart kosten würde (nur RULES.md
   präzisieren, oder zusätzlich ein Folgeticket mit Code-Änderung). Einen
   Vorschlag, welche Lesart gelten soll, darfst du machen, gekennzeichnet als
   „Vorschlag“. Die Entscheidung trifft der Mensch, umgesetzt wird sie mit
   `/rulechange`. Sag dazu, ob die Frage vor dem Merge geklärt sein muss,
   also ob die andere Lesart diesen PR ändern würde, oder danach geklärt
   werden kann.
4. **Sonst:** „Keine Handlung aus diesem Review. Mergebar nach der Regel in
   `CLAUDE.md`.“

Keine Schritte, die über den PR und seine Befunde oder Fragen hinausgehen.

### Abschluss

Die Zusammenfassung im Chat ist derselbe Text plus der Link zum Kommentar.
Die letzte Zeile im Chat ist `ERGEBNIS: <Wert> <Head-SHA, 7 Zeichen>`, damit
`/orchestrate` sie auswerten kann. Musstest du anhalten, bevor ein Kommentar
geschrieben war: `ERGEBNIS: STOPP: <ein Satz Grund>`.
Bei einem neuen Head-SHA gibt es einen neuen Kommentar. Alte Kommentare nicht
bearbeiten.
