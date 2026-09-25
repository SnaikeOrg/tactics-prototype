# Entscheidungen

Eine Zeile pro Entscheidung: Datum, Beschluss, Begründung. Dieselbe Diskussion nicht erneut führen, bis eine neue Zeile sie ersetzt.

- 2026-09-18 — Monorepo als `core` / `web` / `sim`. Regeln bleiben von Renderer und Simulator getrennt, damit `sim` ohne UI replayen kann.
- 2026-09-18 — `core` importiert nie `web` oder `sim`. Sonst hängen Tests an UI oder Simulator.
- 2026-09-18 — Zufall in `core` nur über injizierten, seedbaren Generator, nie `Math.random()`. Sonst sind Tests und `sim` nicht reproduzierbar.
- 2026-09-18 — `docs/RULES.md` ist die Quelle der Wahrheit für Spielregeln, nicht für Architektur.
- 2026-09-18 — Branches `feat/` / `fix/` / `chore/` plus Ticketnummer; ein Feature, ein Branch, ein PR. Verhindert Misch-Diffs und erzwingt den Schutz von `main`.
- 2026-09-18 — Commit nach jedem grünen Testlauf, nicht nach der Arbeitssitzung. Sonst fehlt dem Agenten die Rückkopplung.
- 2026-09-23 — §2.2, §10.2, §19, §25: „Angrenzend“ heisst Chebyshev-Distanz 1 (alle 8 Nachbarfelder), zentral in §2.2 definiert. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §4: Ecken schneiden verboten, wenn eines der beiden orthogonalen Nachbarfelder der Diagonale Wall oder von einer Einheit (beliebiges Team) besetzt ist. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §5.1: Gleichstand bei SPD nur nach Unit-ID; IDs ab 1 in Spawn-Reihenfolge, Spieler vor Gegnern. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §6: Items entfallen in V0.1, alle Verweise entfernt. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §23: „Healer oder Support“ wird zu „Healer“. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §23: Distanzbonus +10, wenn Chebyshev-Distanz Angreifer (nach Bewegung) zu Ziel > 1; bei AoE einmal pro Angriff, gemessen zum Zielfeld. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §23, §23.1: Schaden im Score und im Gesamtschaden ist min(Schaden, verbleibende HP des Ziels). Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §23: Existiert eine Angriffsoption (trifft mindestens einen Gegner), bewertet die KI nur Angriffsoptionen; sonst §23.2. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §23.2: Nächster Gegner nach Pfadkosten bis zu einem angrenzenden Feld, Gleichstand niedrigere Unit-ID, kein Pfad → WAIT. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §2.3, §23.1, §23.2: Tile-ID = y × Kartenbreite + x, Ursprung oben links; Annäherung so weit wie MOV reicht, Gleichstand niedrigere Tile-ID. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §25: Feste 10×10-Karte mit Legende und Spawn-Zuordnung für die erste Testmission. Beantwortet offene Fragen, die v1 blockieren.
- 2026-09-23 — §23.1: Fünftes Gleichstandskriterium ist die niedrigere Tile-ID des Standfelds der Angriffsoption. Beantwortet offene Frage, die v1 blockiert (Angriffe auf dasselbe Ziel von verschiedenen, gleich teuren Standfeldern).
- 2026-09-24 — Ticketnummer im Branch ist die GitHub-Issue-Nummer, kein eigener Branch-Zähler. Beide Zählungen kollidierten (Branch `chore/11` ≠ Issue #11).
- 2026-09-24 — Test-first: Der Commit mit den neuen, roten Tests ist die einzige Ausnahme von „Commit nur nach grünem Test“. Er belegt, dass die Tests das fehlende Verhalten prüfen.
- 2026-09-24 — §18: Besiegte Einheiten werden aus dem Spielzustand gelöscht, es gibt keinen Status „besiegt“. Klärt die Frage 1 aus dem Review von PR #27, und keine Regel braucht eine besiegte Einheit noch.
- 2026-09-24 — §5.1: Unit-IDs vergibt der Level-Aufbau (§25), danach bleiben sie fest und werden nicht neu vergeben. Lückenlosigkeit lässt sich nach dem Entfernen besiegter Einheiten im Spielzustand nicht mehr prüfen, deshalb prüft der Spielzustand nur die Eindeutigkeit.
- 2026-09-24 — §3.4: Auf einem Wall-Feld steht nie eine Einheit, auch nicht beim Spawn. „Nicht begehbar“ heisst nicht betretbar, nicht nur nicht durchquerbar.
- 2026-09-24 — §7: Jede Einheit führt HP und MaxHP als getrennte Werte, MaxHP ist in V0.1 fest. §16 und §23 brauchen beide Werte.
- 2026-09-24 — §18: „Lebende Einheit“ heisst jede Einheit im Spielzustand. §5, §5.1 und §9 bleiben wörtlich, ohne einen eigenen Lebend-Status vorauszusetzen.
- 2026-09-24 — §24: Sieg heisst keine gegnerische Einheit mehr im Spielzustand, Niederlage keine Spielerfigur mehr. Folgt aus §18, es muss nicht mitgezählt werden, wer besiegt wurde.
- 2026-09-25 — `/orchestrate` darf PRs nach `main` mergen, wenn das neueste `/pr-review` für den Head-SHA `MERGEBAR` ergibt; Stopps, Befunde und Regelfragen gehen an Stephan. Tickets laufen ohne Mensch durch, Entscheidungen bleiben beim Menschen.
