---
name: rulechange
description: Übernimmt eine von Stephan getroffene Regelentscheidung in
  docs/RULES.md und leitet die Folgen für GitHub-Issues ab. Verwenden, wenn
  eine Spielregel geändert, ergänzt oder gestrichen werden soll.
argument-hint: "<Entscheidung, Begründung, optional Issue-Nummer>"
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
- die Begründung fehlt (DECISIONS.md braucht eine).

Alle offenen Punkte in einer Nachricht sammeln.

## Ticketnummer

Die Ticketnummer ist immer eine GitHub-Issue-Nummer. Nennt die Entscheidung
ein bestehendes Issue, gilt dessen Nummer. Sonst legt Schritt 4 nach „ok“
ein Issue für die Regeländerung an, und der Branch bekommt dessen Nummer. Bis
dahin arbeitest du lokal auf `chore/rules-<kurz>`.

## Schritt 1: RULES.md anpassen

- `git fetch origin main`, dann Branch `chore/<Issue-Nr>-<kurz>` von
  `origin/main` anlegen, ohne Issue-Nr vorerst `chore/rules-<kurz>`.
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

| Kat.          | Wann                                                             | Folge                                                                                 |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| A neu         | kein Issue und kein Code zum Verhalten                           | neues Ticket                                                                          |
| B anpassen    | offenes Issue, Verhalten nicht umgesetzt, Regel bleibt           | Issue-Text anpassen                                                                   |
| C Änderung    | Verhalten in `core` umgesetzt (Issue geschlossen oder gar keins) | neues Änderungsticket, seine Abnahme-Tests müssen mit dem aktuellen Code fehlschlagen |
| D schliessen  | offenes Issue, Verhalten nicht umgesetzt, Regel entfällt         | Issue schliessen, `state_reason: not_planned`                                         |
| E keine Folge | nur Klarstellung, Verhalten unverändert                          | nichts                                                                                |

Wird eine umgesetzte Regel gestrichen, ist das C (Rückbau), nicht D.

Unabhängig von der Kategorie: Löst die Änderung eine offene Frage, von der
ein Issue mit Label `blocked` abhängt? Dann in der Tabelle als „entsperrt“
markieren.

## Schritt 3: Vorschlag ausgeben und anhalten

1. Das Issue für die Regeländerung (bestehende Nummer oder Titel und Body des
   neuen) sowie den RULES.md- und DECISIONS.md-Diff zeigen.
2. Tabelle: Kat. | Issue-Nr oder „neu“ | Titel | was sich ändert | entsperrt
   (ja/nein).
3. Für C: die Abnahme-Tests nennen, die heute fehlschlagen sollen, und die
   bestehenden Tests in `core`, die das alte Verhalten festschreiben.

Nichts pushen, anlegen, ändern oder schliessen, bevor ich „ok“ schreibe.
Kommt „ok“ mit Änderungen, Tabelle anpassen und erneut anhalten.

## Schritt 4: Nach „ok“

In dieser Reihenfolge, damit Issues auf den PR verweisen können:

1. Gibt es noch kein Issue für die Regeländerung: anlegen, Format wie die
   bestehenden Tickets (`Bezug` / `Aufgabe` / `Abnahme` / `Nicht Teil dieses
Tickets` / `Abhängig von`). Branch lokal umbenennen:
   `git branch -m chore/<Issue-Nr>-<kurz>`.
2. Branch pushen, PR öffnen. Titel `chore(<Issue-Nr>): …`, im Body
   `Closes #<Issue-Nr>` und die Tabelle aus Schritt 3.
3. Folge-Issues anlegen oder ändern wie vorgeschlagen, im selben Format.
   Unter `Abhängig von` das Issue der Regeländerung eintragen.
4. D: mit Kommentar schliessen (welcher §, welcher PR).
5. Entsperrte Issues: Label `blocked` entfernen, Kommentar mit dem
   auflösenden §.
6. Den PR-Body um die tatsächlichen Issue-Nummern ergänzen.
