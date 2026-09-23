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
