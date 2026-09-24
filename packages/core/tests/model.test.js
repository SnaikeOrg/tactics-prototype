import { describe, expect, it } from "vitest";
import {
  createGameState,
  createMap,
  createUnit,
  isInBounds,
  loadUnitTemplates,
} from "../src/index.js";

describe("Datenmodell", () => {
  it("Ein GameState mit zwei Einheiten auf Feld (3,3) wird abgelehnt.", () => {
    const [template] = loadUnitTemplates();
    const map = createMap(10, 10);
    const units = [
      createUnit(template, { id: 1, team: "player", position: { x: 3, y: 3 } }),
      createUnit(template, { id: 2, team: "enemy", position: { x: 3, y: 3 } }),
    ];

    expect(() => createGameState({ map, units })).toThrow(/besetzt/);
  });

  it("Auf einer 10×10-Karte gelten (10,0) und (−1,5) als ausserhalb, (9,9) als innerhalb.", () => {
    const map = createMap(10, 10);

    expect(isInBounds(map, { x: 10, y: 0 })).toBe(false);
    expect(isInBounds(map, { x: -1, y: 5 })).toBe(false);
    expect(isInBounds(map, { x: 9, y: 9 })).toBe(true);
  });

  it("Die Datendatei unter `packages/core/data` lässt sich laden und liefert 8 Vorlagen.", () => {
    expect(loadUnitTemplates()).toHaveLength(8);
  });

  it("Jede Vorlage enthält HP, ATK, DEF, MAG, RES, SPD, MOV und eine Basic Attack mit Zieltyp, minRange, maxRange, Schadensart, Multiplikator und Area.", () => {
    for (const template of loadUnitTemplates()) {
      for (const stat of ["hp", "atk", "def", "mag", "res", "spd", "mov"]) {
        expect(template.stats).toHaveProperty(stat, expect.any(Number));
      }
      expect(template.basicAttack).toEqual({
        target: expect.any(String),
        minRange: expect.any(Number),
        maxRange: expect.any(Number),
        damageType: expect.any(String),
        multiplier: expect.any(Number),
        area: expect.any(String),
      });
    }
  });
});
