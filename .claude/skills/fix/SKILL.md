---
name: fix
description: Behebt die als (behebbar) markierten Befunde aus dem neuesten
  /pr-review eines PRs, mit genau der dort vorgeschlagenen kleinsten
  Änderung. Wird von /orchestrate bei NACHARBEIT aufgerufen.
argument-hint: "<PR-Nummer>"
---

# Befunde beheben

PR: $ARGUMENTS (Repo `SnaikeOrg/tactics-prototype`)

Du behebst nur, was der Review als behebbar markiert hat, und nur so, wie er
es vorschlägt. Du entscheidest nichts. Wo dieser Skill „anhalten“ sagt:
nichts pushen und mit der `ERGEBNIS:`-Zeile enden.

Die letzte Zeile deiner Antwort ist immer genau eine dieser beiden:

- `ERGEBNIS: PR <Nummer>` (derselbe oder ein neuer PR),
- `ERGEBNIS: STOPP: <ein Satz Grund>`.

## 0. Vorbereitung

- `git status --porcelain` muss leer sein, sonst anhalten.
- PR lesen (`pull_request_read`): Head-SHA, Body, Branch, `Closes #N`. Das
  Issue lesen, dazu die Abschnitte aus `Bezug` in `docs/RULES.md` und
  `.claude/skills/ticket/SKILL.md`. Dessen Regeln gelten auch für dich,
  ausser wo dieser Skill ausdrücklich abweicht.
- Den neuesten `/pr-review`-Kommentar des PRs lesen. Anhalten, wenn
  - er nicht den aktuellen Head-SHA nennt,
  - sein Ergebnis nicht `NACHARBEIT` ist,
  - ein Punkt „nicht prüfbar“ ist,
  - ein Befund nicht mit „(behebbar)“ markiert ist,
  - die Handlungsanweisung für einen Befund keine eindeutige Änderung nennt.
- `git fetch origin main pull/<PR>/head:pr-<PR>`. Test-Commit ist der erste
  Eintrag von `git rev-list --reverse --no-merges origin/main..pr-<PR>`.
- `pnpm install --frozen-lockfile`.

## 1. Befunde einteilen

- **Test-Befund**: Die Änderung betrifft eine Datei aus dem Test-Commit
  (Tests oder Stubs).
- **Code-Befund**: alles andere.

Gibt es mindestens einen Test-Befund: Schritt 3. Sonst Schritt 2.

## 2. Nur Code-Befunde: auf dem bestehenden Branch

- Branch des PRs auschecken (`git switch -C <Branch> pr-<PR>`).
- Genau die vorgeschlagenen Änderungen umsetzen. Keine Testdatei anfassen.
- `pnpm test`, `pnpm typecheck`, `pnpm lint` vom Root, alle grün.
- Ein Commit: `fix(<Issue-Nr>): <Befund-Nummern und ein Satz>`.
- Normal pushen. Nie Force-Push.
- Weiter mit Schritt 4, PR ist derselbe.

## 3. Test-Befunde: neuer Branch statt Historie umschreiben

Die Tests dürfen nach dem Test-Commit nicht mehr geändert werden. Deshalb
wird der Test-Commit auf einem neuen Branch neu aufgebaut. Die Historie des
alten Branches bleibt unverändert, es gibt keinen Force-Push.

- Neuer Branch von `origin/main`: `feat/<Issue-Nr>-<kurz>-v<k>`. `k` ist die
  nächste freie Zahl ab 2 (`git ls-remote origin 'feat/<Issue-Nr>-*'`).
- Test-Commit übernehmen, ohne ihn zu committen:
  `git cherry-pick -n <Test-Commit>`. Die Test-Befunde genau wie
  vorgeschlagen korrigieren. `pnpm test`: Jeder neue Test schlägt fehl, an
  einer Assertion oder an „not implemented“. Sonst anhalten. Commit mit der
  Nachricht des alten Test-Commits.
- Die übrigen Commits des PRs übernehmen:
  `git cherry-pick <Test-Commit>..pr-<PR>`. Konflikt: `git cherry-pick
--abort` und anhalten.
- Code-Befunde wie in Schritt 2 als eigener `fix(…)`-Commit.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, alle grün. Dann gilt:
  `git diff <neuer Test-Commit> HEAD -- '*.test.js'` ist leer.
- Branch pushen, neuen PR nach `main` öffnen. Titel wie der alte PR. Body wie
  in `/ticket` Schritt 5, mit der Zusammenfassung des neuen roten Laufs,
  dazu die Zeile „Ersetzt #<alter PR> (Befunde <Nummern> aus <Link zum
  Review>)“.
- Im alten PR kommentieren: „Ersetzt durch #<neuer PR>.“ Dann den alten PR
  schliessen (`update_pull_request`, state `closed`). Den alten Branch nicht
  löschen.

## 4. Abschluss

- Ins Issue kommentieren:
  `/fix Runde: PR #<alt> → #<neu oder derselbe>, Befunde <Nummern>`.
- Zum Ausgangsbranch zurück, `pr-<PR>` löschen.
- Letzte Zeile: `ERGEBNIS: PR <Nummer>`.

## Nie

- Etwas beheben, das nicht als „(behebbar)“ im Review steht, oder anders als
  vorgeschlagen.
- `docs/RULES.md`, `packages/core/data` oder das Issue ändern.
- Einen Testnamen, eine Eingabe oder einen Erwartungswert ändern, den kein
  Befund nennt.
- Force-Push, Branches löschen, mergen, `/rulechange` aufrufen.
