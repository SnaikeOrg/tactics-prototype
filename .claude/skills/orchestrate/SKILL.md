---
name: orchestrate
description: Arbeitet die offenen GitHub-Issues in der Reihenfolge ihrer
  Abhängigkeiten ab. Pro Ticket setzt ein Subagent es mit /ticket um, ein
  zweiter prüft den PR mit /pr-review, behebbare Befunde behebt ein dritter
  mit /fix, bei MERGEBAR wird gemergt. Alles andere geht an Stephan.
argument-hint: "[max. Anzahl Tickets, Standard: alle]"
disable-model-invocation: true
---

# Backlog orchestrieren

Limit: $ARGUMENTS (Repo `SnaikeOrg/tactics-prototype`)

Du setzt nichts selbst um und prüfst nichts selbst. Du wählst Tickets aus,
startest Subagents (`/ticket`, `/pr-review`, `/fix`), wertest ihre
Ergebniszeile aus, mergst bei MERGEBAR und
benachrichtigst Stephan bei allem anderen. Der Stand steht in GitHub-Labels,
nicht in deinem Gedächtnis, damit ein neuer Aufruf dort weitermacht.

## Labels

- `orchestrator:in-arbeit`: Ticket ist gestartet, PR noch nicht gemergt.
- `orchestrator:wartet`: Stephan muss entscheiden oder nacharbeiten. Wird
  nur von Stephan entfernt. Entfernt er es bei offenem PR, heisst das: fertig
  nachgearbeitet oder entschieden, der PR soll neu geprüft werden.

## 0. Start

- `git status --porcelain` muss leer sein. Sonst anhalten und die Dateien
  nennen.
- `git fetch origin main`, `pnpm install --frozen-lockfile`.
- Aufräumen aus einem früheren Lauf: Für jedes offene Issue mit
  `orchestrator:in-arbeit`:
  - offener PR mit `Closes #N` → weiter bei Schritt 3 (Review) mit diesem PR,
  - kein PR → Label `orchestrator:wartet` setzen und Stephan melden
    („abgebrochener Lauf, Branch prüfen“). Nicht neu starten, `/ticket` hält
    bei einem vorhandenen Branch ohnehin an.
- Wieder aufnehmen: Für jedes offene Issue ohne beide Labels, zu dem es einen
  offenen PR mit `Closes #N` und mindestens einen `/pr-review`-Kommentar gibt:
  Label `orchestrator:in-arbeit` setzen, weiter bei Schritt 3 mit diesem PR.
  Immer neu prüfen, auch bei unverändertem Head-SHA, weil sich `main` oder
  `docs/RULES.md` seitdem geändert haben können.

## 1. Nächstes Ticket wählen

- Alle offenen Issues lesen (`list_issues`, Status OPEN). Abhängigkeiten sind
  die `#N` im Abschnitt `Abhängig von`.
- Bereit ist ein Issue, wenn
  - jede Abhängigkeit geschlossen ist,
  - es keines der beiden Labels trägt,
  - es keinen offenen PR mit `Closes #<Nr>` gibt.
- Von den bereiten das mit der niedrigsten Nummer. Keines bereit → Schritt 6.
- Nie mehr als ein Ticket gleichzeitig. Beide Skills brauchen dasselbe
  saubere Arbeitsverzeichnis.

## 2. Umsetzen

- Label `orchestrator:in-arbeit` setzen.
- Subagent starten (`Agent`, `general-purpose`, im Vordergrund) mit diesem
  Prompt:

  > Repo `SnaikeOrg/tactics-prototype`, Arbeitsverzeichnis ist das
  > Repo-Root. Führe den Skill `ticket` mit Argument `<Nr>` über das
  > Skill-Tool aus und folge ihm genau. Du bist ein Subagent: Niemand
  > beantwortet Rückfragen. Wo der Skill „anhalten“ sagt, hörst du auf.
  > Deine letzte Zeile ist die `ERGEBNIS:`-Zeile aus dem Skill.

- Letzte Zeile auswerten:
  - `ERGEBNIS: PR <n>` → PR lesen und bestätigen, dass er offen ist und
    `Closes #<Nr>` enthält. Weiter mit Schritt 3.
  - `ERGEBNIS: STOPP …` oder keine gültige Zeile → Schritt 5 mit dem Grund.

## 3. Prüfen

- Einen **neuen** Subagent starten, nie den aus Schritt 2 weiterführen:

  > Repo `SnaikeOrg/tactics-prototype`, Arbeitsverzeichnis ist das
  > Repo-Root. Führe den Skill `pr-review` mit Argument `<PR>` über das
  > Skill-Tool aus und folge ihm genau. Du bist ein Subagent: Niemand
  > beantwortet Rückfragen. Deine letzte Zeile ist die `ERGEBNIS:`-Zeile aus
  > dem Skill.

- Der Chat des Subagents allein reicht nicht. Gegenprüfen:
  - PR lesen: Der neueste `/pr-review`-Kommentar nennt denselben Head-SHA wie
    der aktuelle Head des PRs.
  - Seine Zeile `Ergebnis:` stimmt mit der `ERGEBNIS:`-Zeile des Subagents
    überein.
  - Stimmt eins davon nicht: Schritt 5 („Review passt nicht zum Head“).
- Ergebnis auswerten:
  - `MERGEBAR` → Schritt 4.
  - `NACHARBEIT` → Schritt 3a, wenn alle Bedingungen dort erfüllt sind,
    sonst Schritt 5.
  - `ENTSCHEIDUNG` oder `STOPP` → Schritt 5.

## 3a. Beheben

Nur wenn

- kein Punkt im Review „nicht prüfbar“ ist,
- jeder Befund mit „(behebbar)“ markiert ist,
- es im Issue seit dem letzten Kommentar, der mit `**/orchestrate:` beginnt
  (bzw. seit Beginn), weniger als 2 Kommentare gibt, die mit `/fix Runde`
  beginnen.

Sonst Schritt 5 („Befund nicht automatisch behebbar“ bzw. „2 Fix-Runden
ohne MERGEBAR“).

- Einen **neuen** Subagent starten:

  > Repo `SnaikeOrg/tactics-prototype`, Arbeitsverzeichnis ist das
  > Repo-Root. Führe den Skill `fix` mit Argument `<PR>` über das Skill-Tool
  > aus und folge ihm genau. Du bist ein Subagent: Niemand beantwortet
  > Rückfragen. Deine letzte Zeile ist die `ERGEBNIS:`-Zeile aus dem Skill.

- `ERGEBNIS: PR <n>` → PR `<n>` lesen und bestätigen, dass er offen ist und
  `Closes #<Nr>` enthält. Weiter mit Schritt 3 für PR `<n>`, mit einem neuen
  Review-Agent.
- `ERGEBNIS: STOPP …` oder keine gültige Zeile → Schritt 5.

## 4. Mergen

Nur wenn Schritt 3 `MERGEBAR` für den aktuellen Head-SHA ergibt:

- CI prüfen: `pull_request_read` mit `get_check_runs`. Jeder Check auf dem
  Head-SHA ist `completed` mit `success`. Laufen noch Checks, erneut
  abfragen, bis alle fertig sind. Ein roter oder fehlender Check → Schritt 5
  („CI rot“ bzw. „keine CI“), nicht mergen.
- `merge_pull_request` mit Methode `merge` und dem Head-SHA als
  `expectedHeadSha`, damit nichts gemergt wird, was nach dem Review
  gepusht wurde.
- Bestätigen, dass das Issue geschlossen ist. Sonst Schritt 5.
- Label `orchestrator:in-arbeit` entfernen, `git fetch origin main`.
- Branches nicht löschen.
- Limit erreicht → Schritt 6. Sonst zurück zu Schritt 1.

## 5. An Stephan übergeben

Bei STOPP, ENTSCHEIDUNG, NACHARBEIT, die Schritt 3a nicht behebt, oder
jedem Widerspruch:

- Label `orchestrator:in-arbeit` durch `orchestrator:wartet` ersetzen.
- Einen Kommentar ins Issue, beginnend mit `**/orchestrate: <Ergebnis>`:
  Grund in einem Satz, Link zum PR bzw.
  zum Review-Kommentar. Gibt es einen offenen PR, als letzter Satz: „Nach
  Nacharbeit oder Entscheidung das Label `orchestrator:wartet` entfernen,
  dann prüft `/orchestrate` den PR neu.“
- Stephan benachrichtigen (`PushNotification`, unter 200 Zeichen; zusätzlich
  im Chat): Issue, Ergebnis, Grund, Link.
- Nichts selbst beheben, nichts pushen, `/rulechange` nie aufrufen. Beheben
  darf nur der `/fix`-Subagent aus Schritt 3a.
- Zurück zu Schritt 1. Issues, die direkt oder indirekt von einem wartenden
  Issue abhängen, sind nicht bereit, weil es offen bleibt.

## 6. Abschluss

Im Chat und als Benachrichtigung:

- gemergt: Issue → PR,
- wartet: Issue → Grund und Link,
- nicht bereit: Issue → offene Abhängigkeiten.

## Nie

- Code, Tests, `docs/RULES.md` oder `packages/core/data` ändern.
- Einen PR mergen ohne `MERGEBAR`-Review und grüne CI für genau seinen
  Head-SHA.
- Force-Push, Issues schliessen, Labels `orchestrator:wartet` entfernen.
- Ein Ticket starten, dessen Abhängigkeiten nicht alle geschlossen sind.
