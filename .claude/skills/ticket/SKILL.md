---
name: ticket
description: Setzt ein einzelnes GitHub-Issue aus dem Backlog test-first
  bis zum Pull Request um. Verwenden, wenn ein Ticket abgearbeitet werden
  soll.
argument-hint: "<Issue-Nummer>"
---

# Ticket umsetzen

Issue: $ARGUMENTS (Repo `SnaikeOrg/tactics-prototype`)

Genau ein Issue pro Aufruf. Wo dieser Skill „anhalten“ sagt: im Chat
melden, was fehlt oder widerspricht, und auf Antwort warten. Nichts pushen,
nichts ins Issue schreiben.

## 0. Auf den neuesten Stand bringen

Vor allem anderen, damit RULES.md, Code und Tests dem aktuellen `main`
entsprechen:

- `git status --porcelain` muss leer sein. Sonst anhalten und die Dateien
  nennen. Nichts verwerfen oder stashen.
- `git fetch origin main`
- Branch `feat/<Issue-Nr>-<kurz>` direkt von `origin/main` anlegen:
  `git switch -c feat/<Issue-Nr>-<kurz> origin/main`. Kebab-case, zum
  Beispiel `feat/21-ki-optionen-bewerten`. Gibt es den Branch schon:
  - nur lokal und ohne eigene Commits (etwa von einem abgebrochenen Aufruf):
    mit `git switch -C … origin/main` neu setzen,
  - mit eigenen Commits oder auf `origin`: anhalten.
- `pnpm install --frozen-lockfile`, falls `main` neue Abhängigkeiten
  mitbringt.

Kein `git pull` auf den aktuellen Branch. Der kann ein alter Feature-Branch
sein, und ein Pull würde `main` dort hineinmergen.

## 1. Verstehen

- Issue lesen (`issue_read`). Die Abschnitte heissen `Bezug`, `Aufgabe`,
  `Abnahme`, `Nicht Teil dieses Tickets` und `Abhängig von`. Fehlt `Bezug`
  oder `Abnahme`: anhalten.
- Ist das Issue geschlossen oder gibt es schon einen offenen PR dazu:
  anhalten.
- Die Abschnitte aus `Bezug` in docs/RULES.md lesen, dazu die Abschnitte, auf
  die sie verweisen.
- Abhängigkeiten: Jedes Issue unter `Abhängig von` muss geschlossen sein, und
  der schliessende PR muss in `main` gemergt sein. Nicht erfüllt: anhalten und
  die offenen Nummern nennen.
- Anhalten und fragen, nichts ergänzen, wenn
  - ein Abnahmepunkt mehrdeutig ist, also mehr als ein Ergebnis zulässt,
  - ein Abnahmepunkt oder eine Zahl RULES.md widerspricht (RULES.md gewinnt,
    das Issue muss angepasst werden),
  - ein Abnahmepunkt etwas verlangt, das unter „Nicht Teil“ steht.
- Die bestehende API in `packages/core/src` lesen und nutzen. Keine
  Parallelstrukturen zu Funktionen, die schon existieren.

## 2. Tests zuerst

- Testdatei: `packages/<paket>/tests/<thema>.test.js`, Stil wie
  `packages/core/tests/rng.test.js`. Importiert wird nur über
  `src/index.js`.
- Pro Abnahmepunkt genau ein `it(...)`. Enthält ein Punkt mehrere Fälle
  (etwa „23/48 bringt +40, 24/48 nicht“), gehören sie als mehrere `expect`
  in denselben Test.
- Der Testname ist der Wortlaut des Abnahmepunkts ohne `- [ ]`.
- Eingaben und Erwartungswerte exakt wie im Issue. Nichts runden, nichts
  umrechnen, keine Werte ergänzen.
- Steht unter „Nicht Teil“, dass ein Abnahmepunkt nicht getestet wird, gibt
  es für ihn keinen Test. In Schritt 5 ausweisen.
- Neue Funktionen nur als Stub anlegen: Signatur mit JSDoc-Typen und
  `throw new Error("not implemented")`, exportiert über `index.js`. So
  schlägt jeder Test einzeln fehl und nicht die ganze Datei beim Import.
- `pnpm test` ausführen. Jeder neue Test muss fehlschlagen, und zwar an einer
  Assertion oder an „not implemented“. Syntax- und Importfehler zählen nicht.
  Die Zusammenfassung des Laufs festhalten.
- Ist ein neuer Test schon grün: anhalten. Entweder existiert das Verhalten
  bereits, oder der Test prüft das Falsche.
- Commit mit Tests und Stubs. Das ist die einzige erlaubte Ausnahme von
  „Commit nur nach grünem `pnpm test`“.

## 3. Umsetzen

- Implementieren, bis alle Tests grün sind, auch die bestehenden.
- Niemals einen Test, einen Erwartungswert oder einen Testnamen aus Schritt 2
  ändern, um ihn grün zu bekommen. Scheint ein Test falsch: anhalten und
  fragen.
- Keine Zahlen aus den Tests im Code. Werte von Einheiten (HP, ATK, DEF, MOV
  usw.) kommen aus `packages/core/data`. Gibt es dort den benötigten Wert noch
  nicht und legt dieses Ticket ihn nicht selbst an: anhalten. Regelkonstanten
  aus RULES.md (etwa +100, 50 %) werden benannte Konstanten mit dem
  §-Verweis als Kommentar.
- Nichts umsetzen, was unter „Nicht Teil“ steht, auch nicht „schon mal
  vorbereitet“.
- Zufall nur über den injizierten Generator (`requireRng`), nie
  `Math.random()`. `core` importiert nie `web` oder `sim`.
- JSDoc-Typen, kein `any` und kein `*`. Nur benannte Exporte.
- Commit mit der Implementierung, sobald `pnpm test` grün ist.

## 4. Prüfen

- `pnpm test`, `pnpm typecheck` und `pnpm lint` vom Root. Alle grün. Einen
  Fehler beheben, nicht unterdrücken (kein `eslint-disable`, kein
  `@ts-ignore`).
- `git diff --stat origin/main...HEAD`. Sind es mehr als fünf Dateien,
  jede zusätzliche begründen.
- Diff gegen „Nicht Teil“ und `Bezug` lesen: Nichts ausserhalb davon
  geändert, keine Balancing-Zahlen verändert.

## 5. Pull Request

- Branch pushen, PR nach `main`.
- Titel: `feat(<Issue-Nr>): <Issue-Titel ohne Präfix>`.
- Body:
  - `Closes #<Issue-Nr>`
  - Tabelle Abnahmepunkt → Testname (Datei). Abnahmepunkte ohne Test mit
    Verweis auf „Nicht Teil“.
  - Zusammenfassung des roten Laufs aus Schritt 2, als Codeblock.
  - Liste der geänderten Dateien, gegebenenfalls mit Begründung.
- Nicht selbst mergen. Den PR-Link im Chat melden.
