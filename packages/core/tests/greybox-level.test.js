import { describe, expect, it } from "vitest";
import {
  createGreyboxLevel,
  isAdjacent,
  pathCosts,
  tileId,
} from "../src/index.js";

describe("Greybox-Level (§25)", () => {
  it("Der aufgebaute GameState enthält 8 Einheiten mit den Unit-IDs 1 bis 8, kein Feld ist doppelt belegt.", () => {
    const { map, units } = createGreyboxLevel();

    expect(units).toHaveLength(8);
    expect(units.map(({ id }) => id).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(
      new Set(units.map(({ position }) => tileId(map, position))).size,
    ).toBe(8);
  });

  it("Die Spielerfiguren haben die Unit-IDs 1–4, die Gegner 5–8.", () => {
    const { units } = createGreyboxLevel();
    /** @param {"player" | "enemy"} team */
    const idsOf = (team) =>
      units
        .filter((unit) => unit.team === team)
        .map(({ id }) => id)
        .sort((a, b) => a - b);

    expect(idsOf("player")).toEqual([1, 2, 3, 4]);
    expect(idsOf("enemy")).toEqual([5, 6, 7, 8]);
  });

  it("Alle Spielerfiguren stehen auf y ≥ 5, alle Gegner auf y ≤ 4.", () => {
    const { units } = createGreyboxLevel();

    for (const unit of units.filter(({ team }) => team === "player")) {
      expect(unit.position.y).toBeGreaterThanOrEqual(5);
    }
    for (const unit of units.filter(({ team }) => team === "enemy")) {
      expect(unit.position.y).toBeLessThanOrEqual(4);
    }
  });

  it("Kein Gegner steht auf einem an eine Spielerfigur angrenzenden Feld (§2.2).", () => {
    const { units } = createGreyboxLevel();
    const players = units.filter(({ team }) => team === "player");
    const enemies = units.filter(({ team }) => team === "enemy");

    for (const enemy of enemies) {
      for (const player of players) {
        expect(isAdjacent(enemy.position, player.position)).toBe(false);
      }
    }
  });

  it("Jede Spielerfigur hat einen Pfad zu jedem Gegner.", () => {
    const state = createGreyboxLevel();
    const players = state.units.filter(({ team }) => team === "player");
    const enemies = state.units.filter(({ team }) => team === "enemy");

    for (const player of players) {
      const reachable = [...pathCosts(state, player.id, Infinity).values()];
      for (const enemy of enemies) {
        // Das Feld des Gegners ist besetzt (§4); ein Pfad zu ihm endet auf
        // einem angrenzenden Feld (§2.2).
        expect(
          reachable.some(({ position }) =>
            isAdjacent(position, enemy.position),
          ),
        ).toBe(true);
      }
    }
  });
});
