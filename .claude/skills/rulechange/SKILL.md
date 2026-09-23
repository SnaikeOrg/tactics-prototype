---
name: rulechange
description: Übernimmt eine von Stephan getroffene Regelentscheidung in
  docs/RULES.md und leitet die Folgen für GitHub-Issues ab. Verwenden, wenn
  eine Spielregel geändert, ergänzt oder gestrichen werden soll.
argument-hint: "<Entscheidung, Begründung, optional Ticketnummer>"
disable-model-invocation: true
---

# Regeländerung

Entscheidung: $ARGUMENTS

Du entscheidest nichts selbst, du formulierst aus. Repo für Issues und PR:
`SnaikeOrg/tactics-prototype`.

## Schritt 0: Prüfen, bevor du etwas änderst

Anhalten und nachfragen, nicht selbst ergänzen, wenn:

- die Entscheidung unvollständig ist (Zahl, Reichweite, Ziel oder Ausnahme
  fehlt, die der betroffene Abschnitt braucht),
- sie einem anderen Abschnitt von RULES.md widerspricht (Abschnitt nennen),
- die Begründung fehlt (DECISIONS.md braucht eine),
- keine Ticketnummer für den Branch genannt ist.

Alle offenen Punkte in einer Nachricht sammeln.

## Schritt 1: RULES.md anpassen

- `git fetch origin main`, dann Branch `chore/<Ticketnummer>-<kurz>` von
  `origin/main` anlegen.
- Nur die betroffenen Abschnitte ändern. Keine Umformulierungen an anderer
  Stelle.
- Abschnittsnummern nie ändern. Ein neuer Abschnitt bekommt die nächste freie
  Nummer auf seiner Ebene (neuer Unterabschnitt unter §10 → nächstes 10.x,
  neuer Hauptabschnitt → nächste freie Hauptnummer). Ein gestrichener
  Abschnitt bleibt als Überschrift mit „entfällt“ stehen, z. B.
  `## 15. Kein automatischer Gegenangriff – entfällt`.
- Löst die Entscheidung einen Punkt aus §27 (Offene Fragen) auf oder holt sie
  etwas aus §26 (Nicht Bestandteil) herein, den Punkt dort streichen. Das
  zählt als betroffener Abschnitt.
- Eine Zeile in docs/DECISIONS.md, im Format der bestehenden Zeilen:
  `- JJJJ-MM-TT — §X: Entscheidung. Begründung.` Datum mit `date +%F`.
- `pnpm test` vom Root, dann committen. Noch nicht pushen.

## Schritt 2: Folgen für Tickets ermitteln

Diff holen: `git diff origin/main -- docs/RULES.md`

Geänderte Abschnitte sind alle §, deren Inhalt im Diff vorkommt. Eine Änderung
in 10.2 betrifft auch §10.

Suche alle Issues, offen und geschlossen (`list_issues` ohne state-Filter,
nicht die Suche), deren Feld „Bezug“ einen geänderten Abschnitt oder dessen
Ober- oder Unterabschnitt nennt. Schreibweisen „§12“, „§ 12“ und „12.1“
gelten gleich.

Prüfe ausserdem, ob `packages/core` das bisherige Verhalten schon umsetzt
(Code und Tests zum Abschnitt), auch wenn kein Issue es nennt.

Ordne jede Zeile (geänderter Abschnitt × betroffenes Issue, oder ein
Abschnitt ohne Issue) genau einer Kategorie zu:

| Kat. | Wann | Folge |
| ---- | ---- | ----- |
| A neu | kein Issue und kein Code zum Verhalten | neues Ticket |
| B anpassen | offenes Issue, Verhalten nicht umgesetzt, Regel bleibt | Issue-Text anpassen |
| C Änderung | Verhalten in `core` umgesetzt (Issue geschlossen oder gar keins) | neues Änderungsticket, seine Abnahme-Tests müssen mit dem aktuellen Code fehlschlagen |
| D schliessen | offenes Issue, Verhalten nicht umgesetzt, Regel entfällt | Issue schliessen, `state_reason: not_planned` |
| E keine Folge | nur Klarstellung, Verhalten unverändert | nichts |

Wird eine umgesetzte Regel gestrichen, ist das C (Rückbau), nicht D.

Unabhängig von der Kategorie: Löst die Änderung eine offene Frage, von der
ein Issue mit Label `blocked` abhängt? Dann in der Tabelle als „entsperrt“
markieren.

## Schritt 3: Vorschlag ausgeben und anhalten

1. Den RULES.md- und DECISIONS.md-Diff zeigen.
2. Tabelle: Kat. | Issue-Nr oder „neu“ | Titel | was sich ändert | entsperrt
   (ja/nein).
3. Für C: die Abnahme-Tests nennen, die heute fehlschlagen sollen, und die
   bestehenden Tests in `core`, die das alte Verhalten festschreiben.

Nichts pushen, anlegen, ändern oder schliessen, bevor ich „ok“ schreibe.
Kommt „ok“ mit Änderungen, Tabelle anpassen und erneut anhalten.

## Schritt 4: Nach „ok“

In dieser Reihenfolge, damit Issues auf den PR verweisen können:

1. Branch pushen, PR öffnen. Im Body die Tabelle aus Schritt 3.
2. Issues anlegen oder ändern wie vorgeschlagen. Format wie in den
   bestehenden Tickets. Gibt es noch keine, mindestens:
   `Bezug: §X` / `Ziel` / `Abnahme` (prüfbare Kriterien) / `Regeländerung: PR #N`.
3. D: mit Kommentar schliessen (welcher §, welcher PR).
4. Entsperrte Issues: Label `blocked` entfernen, Kommentar mit dem
   auflösenden §.
5. Den PR-Body um die tatsächlichen Issue-Nummern ergänzen.
