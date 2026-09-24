# Spielregeln

Quelle der Wahrheit. `packages/core` folgt dieser Datei. Steht eine Regel nicht hier, existiert sie nicht.

Widerspricht der Code dieser Datei, gewinnt `RULES.md`. Zuerst hier ändern, dann implementieren und testen.

## Status

V0.1: wegwerfbarer Greybox-Prototyp eines Tactical RPG. Kampfsystem orientiert sich grundsätzlich an Sword of Convallaria.

Neue Spielregeln zuerst in dieser Datei festhalten. Zahlen nicht stillschweigend im Code ändern.

## Invarianten

- `web` und `sim` erfinden keine eigenen Spielregeln. Sie rufen `core` auf.
- Jede zufällige Spielentscheidung ist seedbar. Dieselbe Eingabe plus dasselbe Seed ergibt dieselbe Folge.
- V0.1-Kampf, Initiative, KI und Combat Forecast sind deterministisch. Es gibt keine Trefferchance, keine kritischen Treffer und keine zufällige Schadensabweichung.

## 1. Zweck von V0.1

Ziel ist ausschliesslich zu prüfen, ob die Kernsysteme spielerisch funktionieren:

- Positionierung
- Bewegung
- Initiative
- Reichweiten
- Schaden
- Skills
- Passives
- Heilung
- einfache Gegner-KI
- Sieg und Niederlage

Nicht Bestandteil von V0.1 sind insbesondere:

- Story
- Equipment
- Inventory
- XP / Level-Ups
- Skill Trees
- Gacha
- Meta-Progression
- Shop
- Crafting
- PvP

## 2. Grid

Das Spielfeld verwendet ein quadratisches Grid.

Bewegung ist in acht Richtungen möglich:

```text
↑ ↓ ← →
↖ ↗ ↙ ↘
```

Diagonale Bewegung wird grundsätzlich gleich behandelt wie horizontale oder vertikale Bewegung.

### 2.1 Distanz

Für Reichweiten wird die Chebyshev-Distanz verwendet.

```text
distance =
max(
  abs(x1 - x2),
  abs(y1 - y2)
)
```

Ein diagonal angrenzendes Feld besitzt damit Distanz 1.

### 2.2 Angrenzend

Zwei Felder grenzen aneinander, wenn ihre Chebyshev-Distanz (§2.1) genau 1 ist.

Jedes Feld hat damit bis zu acht angrenzende Felder:

```text
X X X
X T X
X X X
```

Diese Definition gilt überall, wo diese Datei von „angrenzend“ spricht.

### 2.3 Tile-ID

Jedes Feld besitzt eine feste Tile-ID:

```text
Tile-ID = y × Kartenbreite + x
```

Ursprung `(0,0)` ist oben links, `x` wächst nach rechts, `y` nach unten.

Die Tile-ID wird für deterministische Gleichstandsregeln verwendet (§23.1, §23.2).

## 3. Gelände

### 3.1 Ground

```text
Movement Cost: 1
Begehbar: Ja
```

Keine weiteren Effekte.

### 3.2 Forest

```text
Movement Cost: 2
Begehbar: Ja
```

In V0.1 keine DEF-, EVA- oder sonstigen Boni.

### 3.3 High Ground

```text
Movement Cost: 1
Begehbar: Ja
```

In V0.1 noch keine Kampfboni.

### 3.4 Wall

```text
Begehbar: Nein
```

Walls:

- können nie von einer Einheit besetzt sein, auch nicht beim Spawn;
- blockieren Bewegung;
- blockieren Pathfinding;
- blockieren in V0.1 noch keine Fernkampfangriffe;
- blockieren in V0.1 noch keine Sichtlinie.

Ein Line-of-Sight-System existiert in V0.1 nicht.

## 4. Bewegung

Jede Einheit besitzt einen Wert:

```text
MOV
```

Dieser entspricht den verfügbaren Bewegungspunkten pro Aktivierung.

Beispiel:

```text
MOV = 4

Ground → Forest → Ground

1 + 2 + 1 = 4
```

Zusätzliche Regeln:

- Gegner können nicht durchquert werden.
- Eigene Einheiten können in V0.1 ebenfalls nicht durchquert werden.
- Zwei Einheiten können nie dasselbe Feld besetzen.
- Besiegte Einheiten blockieren kein Feld.
- Diagonale Bewegung ist erlaubt.
- Ecken schneiden ist verboten: Ein diagonaler Schritt ist nicht erlaubt, wenn mindestens eines der beiden orthogonal benachbarten Felder, zwischen denen die Diagonale hindurchführt, ein Wall-Feld ist oder von einer Einheit besetzt ist, unabhängig vom Team.
- Eine Einheit muss ihre Bewegung nicht vollständig ausschöpfen.

## 5. Runden und Initiative

Jede Einheit besitzt:

```text
SPD
```

Zu Beginn jeder Runde werden alle lebenden Einheiten einmal nach SPD sortiert.

```text
höhere SPD
→ früherer Zug
```

Die Initiative bleibt während der gesamten Runde fix.

Änderungen von SPD während einer Runde beeinflussen erst die Initiative der nächsten Runde.

### 5.1 Gleichstand

Bei gleicher SPD entscheidet ausschliesslich die Unit-ID:

```text
niedrigere Unit-ID
→ früherer Zug
```

Unit-IDs werden in Spawn-Reihenfolge ab 1 vergeben. Spielerfiguren spawnen vor den Gegnern.

Die Unit-IDs werden beim Aufbau des Levels vergeben (§25) und bleiben während des ganzen Kampfs fest. Die ID einer besiegten Einheit wird nicht neu vergeben.

Es wird kein Zufall verwendet.

Jede lebende Einheit erhält pro Runde genau eine Aktivierung.

## 6. Aktionen pro Zug

Jede Einheit besitzt pro Aktivierung:

```text
1× Movement
+
1× Action
```

Erlaubt:

```text
MOVE → ACTION
MOVE → WAIT
ACTION ohne MOVE
WAIT ohne MOVE
```

Nicht erlaubt:

```text
ACTION → MOVE
```

Mögliche Aktionen:

- Basic Attack
- Skill
- Wait

Nach Ausführung einer Aktion oder `Wait` endet die Aktivierung.

## 7. Basiswerte

V0.1 verwendet folgende Werte:

```text
HP
ATK
DEF
MAG
RES
SPD
MOV
```

Jede Einheit führt zwei getrennte Werte:

- `MaxHP`: der HP-Wert ihrer Vorlage (§20, §21). In V0.1 ändert er sich im Kampf nicht.
- `HP`: die aktuellen Trefferpunkte. Zu Kampfbeginn gilt `HP = MaxHP`.

Schaden und Heilung ändern nur `HP`.

Nicht Bestandteil von V0.1:

```text
ACC
EVA
CRIT
CRIT_RES
```

Alle gültigen Angriffe treffen garantiert.

Es gibt keine kritischen Treffer.

Es gibt keine zufällige Schadensabweichung.

## 8. Reichweiten

Jede Fähigkeit besitzt:

```text
minRange
maxRange
```

Grundtypen:

```text
Nahkampf:
1–1

Speer:
1–2

Bogen:
2–4

Magie:
meist 2–3

Heilung:
1–3
```

Ein normaler Bogenangriff kann deshalb kein direkt angrenzendes Ziel treffen.

Skills können von diesen Standardreichweiten abweichen.

## 9. Targeting

Jede Fähigkeit verwendet einen Zieltyp.

Unterstützt werden:

```text
SELF
ALLY
ENEMY
TILE
```

**SELF**

Nur die ausführende Einheit ist gültiges Ziel.

**ALLY**

Nur eine lebende verbündete Einheit ist gültiges Ziel.

**ENEMY**

Nur eine lebende gegnerische Einheit ist gültiges Ziel.

**TILE**

Ein Feld innerhalb der Reichweite wird ausgewählt.

Das Feld darf leer sein.

Tile-Targeting wird insbesondere für Flächenangriffe verwendet.

## 10. Wirkungsbereiche

Das System unterstützt folgende Area-Typen:

```text
SINGLE
RADIUS_1
LINE
```

V0.1 verwendet hauptsächlich `SINGLE`.

`LINE` wird technisch vorbereitet, aber noch nicht aktiv verwendet.

### 10.1 SINGLE

Nur das ausgewählte Ziel wird beeinflusst.

### 10.2 RADIUS_1

Beeinflusst:

```text
Zielfeld
+
alle 8 angrenzenden Felder (§2.2)
```

Darstellung:

```text
X X X
X T X
X X X
```

`T` ist das ausgewählte Zielfeld.

`RADIUS_1` umfasst damit maximal neun Felder.

## 11. Friendly Fire

Jeder AoE-Skill besitzt:

```text
friendlyFire
```

Für V0.1 gilt standardmässig:

```text
friendlyFire = false
```

Dann werden nur gegnerische Einheiten getroffen.

Verbündete innerhalb des Wirkungsbereichs werden ignoriert.

Für gegnerische Einheiten gilt dieselbe Regel.

## 12. Physischer Schaden

```text
Physical Damage =
max(
  1,
  floor(ATK × SkillMultiplier - DEF)
)
```

## 13. Magischer Schaden

```text
Magic Damage =
max(
  1,
  floor(MAG × SkillMultiplier - RES)
)
```

## 14. Schadensboni durch Passives

Skill-Multiplikatoren werden vor DEF bzw. RES angewendet.

Passive Damage Bonuses werden anschliessend auf den bereits berechneten Schaden angewendet.

Beispiel:

```text
ATK = 16
SkillMultiplier = 1.3
DEF = 7

16 × 1.3 - 7
= 13.8

floor
= 13
```

Mit:

```text
Reach Advantage
+20 % Final Damage
```

ergibt sich:

```text
13 × 1.2
= 15.6

floor
= 15 Schaden
```

Es wird nach jedem Berechnungsschritt abgerundet.

## 15. Kein automatischer Gegenangriff

Ein normaler Angriff löst keinen Gegenangriff aus.

Ablauf:

```text
Angriff
→ Schaden berechnen
→ HP reduzieren
→ Tod prüfen
→ Trigger abhandeln
→ Aktion beendet
```

Konter werden später ausschliesslich über Skills, Passives oder besondere Fähigkeiten ermöglicht.

## 16. Heilung

```text
Healing =
floor(MAG × HealMultiplier)
```

Heilung kann MaxHP nicht überschreiten.

```text
HP =
min(
  MaxHP,
  HP + Healing
)
```

## 17. Cooldowns

Basic Attacks besitzen keinen Cooldown.

Skills können einen Cooldown besitzen.

Beispiel:

```text
Cooldown = 2
```

Verwendung:

```text
Runde 1:
Skill benutzt

Runde 2:
nicht verfügbar

Runde 3:
wieder verfügbar
```

Cooldowns werden zu Beginn des eigenen Zuges reduziert.

## 18. Tod

Eine Einheit ist besiegt, sobald:

```text
HP ≤ 0
```

Dann gilt sofort:

- Die Einheit wird aus dem Kampf entfernt, das heisst aus dem Spielzustand gelöscht. Einen Zustand „besiegt, aber noch vorhanden“ gibt es nicht.
- Sie blockiert kein Feld mehr.
- Sie kann nicht mehr Ziel zukünftiger Aktionen sein.
- Ein noch ausstehender Zug innerhalb derselben Runde entfällt.

„Lebende Einheit“ bezeichnet in dieser Datei jede Einheit im Spielzustand.

## 19. Passives

Jede Spielerfigur besitzt in V0.1 genau eine Passive.

Das System soll Passives grundsätzlich über folgende Struktur abbilden:

```text
trigger
condition
effect
duration
```

### 19.1 Knight – Hold the Line

Trigger:

```text
START_TURN
```

Condition:

Mindestens ein Gegner befindet sich auf einem angrenzenden Feld (§2.2).

Effect:

```text
DEF +20 %
```

Duration:

```text
bis zum Beginn des nächsten eigenen Zuges
```

### 19.2 Spearman – Reach Advantage

Wenn ein Angriff aus Distanz 2 erfolgt:

```text
Final Damage +20 %
```

### 19.3 Archer – Safe Distance

Wenn beim Angriff kein Gegner an den Archer angrenzt (§2.2):

```text
Final Damage +15 %
```

### 19.4 Healer – Compassion

Befindet sich das Ziel vor der Heilung unter:

```text
50 % MaxHP
```

dann:

```text
Healing +25 %
```

## 20. Spielerfiguren

### 20.1 Knight

```text
HP   48
ATK  14
DEF  10
MAG   4
RES   6
SPD   5
MOV   4
```

Basic Attack

```text
Target: ENEMY
Range: 1–1
Damage Type: Physical
Multiplier: 1.0
Area: SINGLE
```

Power Strike

```text
Target: ENEMY
Range: 1–1
Damage Type: Physical
Multiplier: 1.5
Cooldown: 2
Area: SINGLE
```

Passive:

```text
Hold the Line
```

### 20.2 Spearman

```text
HP   40
ATK  16
DEF   7
MAG   4
RES   5
SPD   7
MOV   4
```

Basic Attack

```text
Target: ENEMY
Range: 1–2
Damage Type: Physical
Multiplier: 1.0
Area: SINGLE
```

Piercing Thrust

```text
Target: ENEMY
Range: 1–2
Damage Type: Physical
Multiplier: 1.3
Cooldown: 2
Area: SINGLE
```

Passive:

```text
Reach Advantage
```

### 20.3 Archer

```text
HP   32
ATK  17
DEF   5
MAG   4
RES   5
SPD   9
MOV   4
```

Basic Attack

```text
Target: ENEMY
Range: 2–4
Damage Type: Physical
Multiplier: 1.0
Area: SINGLE
```

Power Shot

```text
Target: ENEMY
Range: 3–5
Damage Type: Physical
Multiplier: 1.5
Cooldown: 2
Area: SINGLE
```

Passive:

```text
Safe Distance
```

### 20.4 Healer

```text
HP   30
ATK   6
DEF   4
MAG  15
RES   8
SPD   6
MOV   4
```

Basic Attack

```text
Target: ENEMY
Range: 2–3
Damage Type: Magic
Multiplier: 1.0
Area: SINGLE
```

Heal

```text
Target: ALLY
Range: 1–3
HealMultiplier: 1.2
Cooldown: 1
Area: SINGLE
```

Passive:

```text
Compassion
```

## 21. Gegner

### 21.1 Enemy Melee

```text
HP   38
ATK  14
DEF   7
MAG   3
RES   4
SPD   6
MOV   4
```

Basic Attack:

```text
Target: ENEMY
Range: 1–1
Damage Type: Physical
Multiplier: 1.0
Area: SINGLE
```

### 21.2 Enemy Spearman

```text
HP   36
ATK  15
DEF   6
MAG   3
RES   5
SPD   8
MOV   4
```

Basic Attack:

```text
Target: ENEMY
Range: 1–2
Damage Type: Physical
Multiplier: 1.0
Area: SINGLE
```

### 21.3 Enemy Archer

```text
HP   28
ATK  16
DEF   4
MAG   3
RES   4
SPD  10
MOV   4
```

Basic Attack:

```text
Target: ENEMY
Range: 2–4
Damage Type: Physical
Multiplier: 1.0
Area: SINGLE
```

### 21.4 Enemy Mage

```text
HP   30
ATK   5
DEF   4
MAG  16
RES   6
SPD   7
MOV   4
```

Basic Attack

```text
Target: ENEMY
Range: 2–3
Damage Type: Magic
Multiplier: 1.0
Area: SINGLE
```

Fire Blast

Erster AoE-Testskill.

```text
Target: TILE
Range: 2–3
Area: RADIUS_1
Damage Type: Magic
Multiplier: 1.1
Cooldown: 3
Friendly Fire: false
```

Beispielschaden:

```text
gegen Knight:
floor(16 × 1.1 - 6)
= 11
```

```text
gegen Spearman:
floor(16 × 1.1 - 5)
= 12
```

```text
gegen Archer:
floor(16 × 1.1 - 5)
= 12
```

```text
gegen Healer:
floor(16 × 1.1 - 8)
= 9
```

## 22. Combat Forecast

Vor Bestätigung einer Aktion wird das deterministische Ergebnis angezeigt.

Beispiel:

```text
Power Strike

Target HP
38 → 24

Damage
14

[Confirm]
[Cancel]
```

Tödlicher Treffer:

```text
Target HP
8 → 0

Damage
14

LETHAL
```

Heal:

```text
Target HP
15 / 48
→
37 / 48

Healing
22
```

AoE:

Der Forecast zeigt alle betroffenen Einheiten und deren erwartete HP-Veränderung.

Beispiel:

```text
Fire Blast

Knight
48 → 37

Spearman
40 → 28
```

Der Combat Forecast darf den tatsächlichen GameState niemals verändern.

Technisch müssen deshalb getrennt sein:

```text
previewAction()
```

und:

```text
resolveAction()
```

Beide müssen dieselben Regel- und Berechnungsfunktionen verwenden.

## 23. Gegner-KI

V0.1 verwendet ausschliesslich:

```text
AI Profile: Aggressive
```

Die KI plant nicht mehrere Züge voraus.

Zu Beginn ihres Zuges ermittelt sie alle aktuell legalen Angriffsoptionen und bewertet diese.

Eine Angriffsoption ist eine legale Kombination aus Bewegung und Angriffsaktion, die mindestens eine gegnerische Einheit trifft.

Existiert mindestens eine Angriffsoption, werden ausschliesslich Angriffsoptionen bewertet. `WAIT` und reine Bewegung kommen nur in Frage, wenn keine Angriffsoption existiert; dann gilt §23.2.

Grundscore:

```text
Score = 0
```

Bonuspunkte:

```text
+100
Angriff besiegt das Ziel sicher.

+40
Ziel besitzt vor dem Angriff weniger als 50 % MaxHP.

+30
Ziel ist Healer.

+10
Chebyshev-Distanz zwischen Angreifer (nach seiner Bewegung) und Ziel ist im Moment des Angriffs grösser als 1.

+Damage
min(Schaden, verbleibende HP des Ziels).
```

Bei AoE-Angriffen werden die Scores aller betroffenen gegnerischen Einheiten zusammengezählt. Der Bonus +10 wird dabei einmal pro Angriff vergeben; massgeblich ist die Distanz zwischen Angreifer und ausgewähltem Zielfeld.

Verbündete werden bei:

```text
friendlyFire = false
```

nicht als Ziele gewertet und nicht beschädigt.

### 23.1 Gleichstand

Bei gleichem Score entscheidet:

```text
1. höherer Gesamtschaden
2. geringere Bewegungskosten
3. niedrigere Unit-ID des primären Ziels
4. niedrigere Tile-ID bei Tile-Targeting
5. niedrigere Tile-ID des Standfelds der Angriffsoption
```

Gesamtschaden ist die Summe von min(Schaden, verbleibende HP des Ziels) über alle getroffenen gegnerischen Einheiten.

Tile-ID gemäss §2.3.

Es wird kein Zufall verwendet.

### 23.2 Kein Angriff möglich

Falls keine Angriffsoption existiert:

1. Nächster Gegner ist der Gegner mit den geringsten Pfadkosten. Pfadkosten werden gemäss den Bewegungsregeln (§3, §4) bis zu einem an den Gegner angrenzenden Feld (§2.2) berechnet, nicht nach Chebyshev-Distanz. Andere Einheiten blockieren den Pfad wie in §4.
2. Bei gleichen Pfadkosten gilt der Gegner mit der niedrigeren Unit-ID.
3. Existiert zu keinem Gegner ein Pfad, wählt die Einheit `WAIT`.
4. Sonst bewegt sich die Einheit auf dem kürzesten Pfad zum gewählten Gegner so weit, wie ihr MOV reicht. Zielfeld ist das mit dem MOV erreichbare Feld auf einem kürzesten Pfad mit den geringsten verbleibenden Pfadkosten zum Gegner. Bei gleichwertigen Feldern gilt die niedrigere Tile-ID (§2.3).
5. Danach endet ihre Aktivierung.

## 24. Sieg und Niederlage

Sieg

```text
Alle gegnerischen Einheiten besiegt.
```

Niederlage

```text
Alle Spielerfiguren besiegt.
```

Da besiegte Einheiten aus dem Spielzustand gelöscht werden (§18), heisst das: Sieg, sobald keine gegnerische Einheit mehr im Spielzustand ist; Niederlage, sobald keine Spielerfigur mehr im Spielzustand ist.

V0.1 besitzt keine weiteren Missionsziele.

## 25. Greybox-Level

Erste Testmission:

```text
10 × 10 Felder
```

Spieler:

```text
Knight
Spearman
Archer
Healer
```

Gegner:

```text
Enemy Melee
Enemy Spearman
Enemy Archer
Enemy Mage
```

Verwendetes Gelände:

```text
Ground
Forest
High Ground
Wall
```

Beide Teams starten grundsätzlich auf gegenüberliegenden Kartenhälften.

Kein Gegner soll zu Kampfbeginn auf einem an eine Spielerfigur angrenzenden Feld (§2.2) stehen.

Karte:

```text
    0 1 2 3 4 5 6 7 8 9
 0  . . 7 . . . . 8 . .
 1  . F . . 5 6 . . F .
 2  . F . . . . . . F .
 3  . . . H . . H . . .
 4  # # . # # # # . # #
 5  # # . # # # # . # #
 6  . . . H . . H . . .
 7  . F . . . . . . F .
 8  . F . . 1 2 . . F .
 9  . . 3 . . . . 4 . .
```

Legende:

```text
.  Ground
F  Forest
H  High Ground
#  Wall
```

Ziffern sind Spawn-Felder auf Ground. Die Ziffer ist die Unit-ID (§5.1):

```text
1  Knight
2  Spearman
3  Archer
4  Healer
5  Enemy Melee
6  Enemy Spearman
7  Enemy Archer
8  Enemy Mage
```

Die genaue Startposition darf während des Playtests angepasst werden.

## 26. Nicht Bestandteil von V0.1

Noch nicht implementieren:

```text
Accuracy
Evasion
Critical Hits
automatische Counterattacks
Line of Sight
Height Bonuses
Backstab
Facing
Knockback
Poison
Stun
weitere Status Effects
Equipment
Inventory
Character Progression
XP
Level Ups
Skill Trees
Gacha
Story
Shop
Crafting
PvP
```

Diese Systeme können erst nach erfolgreichem Test des V0.1-Kampfkerns ergänzt werden.

## 27. Offene Fragen nach V0.1

Erst nach dem ersten Playtest entscheiden:

- Trefferchance / Accuracy / Evasion
- Critical Hits
- Counter-Skills
- aktive und passive Status Effects
- Höhenboni
- Line of Sight
- Knockback
- Facing und Backstab
- weitere AoE-Formen
- weitere AI-Profile
- komplexere Missionsziele
- Charakterprogression
- Equipment
- Meta-Progression

Der V0.1-Prototyp soll nicht erweitert werden, bevor der bestehende Kern spielbar getestet wurde.
