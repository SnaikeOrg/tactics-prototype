import { describe, expect, it } from "vitest";
import {
  attackOptions,
  createGameState,
  createMap,
  createUnit,
  isValidTarget,
  loadUnitTemplates,
  reachableTiles,
} from "../src/index.js";

/**
 * @param {string} id
 * @returns {ReturnType<typeof loadUnitTemplates>[number]}
 */
function template(id) {
  const found = loadUnitTemplates().find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`Vorlage ${id} fehlt`);
  }
  return found;
}

/**
 * Enemy Melee (Unit-ID 1, Team enemy) und Knight (Unit-ID 2, Team player).
 *
 * @param {{ x: number, y: number }} enemyAt
 * @param {{ x: number, y: number }} knightAt
 * @param {import("../src/grid.js").GameMap} [map]
 */
function meleeVsKnight(enemyAt, knightAt, map = createMap(10, 10)) {
  return createGameState({
    map,
    units: [
      createUnit(template("enemy-melee"), {
        id: 1,
        team: "enemy",
        position: enemyAt,
      }),
      createUnit(template("knight"), {
        id: 2,
        team: "player",
        position: knightAt,
      }),
    ],
  });
}

describe("attackOptions", () => {
  it("Jede Option besteht aus einem erreichbaren Standfeld und einem von dort gültigen Ziel.", () => {
    const state = meleeVsKnight({ x: 0, y: 0 }, { x: 3, y: 3 });
    const reachable = reachableTiles(state, 1);
    const options = attackOptions(state, 1);

    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      const standsStill = option.position.x === 0 && option.position.y === 0;
      const isReachable = reachable.some(
        ({ position }) =>
          position.x === option.position.x && position.y === option.position.y,
      );
      expect(standsStill || isReachable).toBe(true);

      const moved = {
        map: state.map,
        units: state.units.map((unit) =>
          unit.id === 1 ? { ...unit, position: option.position } : unit,
        ),
      };
      expect(
        isValidTarget(
          moved,
          1,
          template("enemy-melee").basicAttack,
          option.targetId,
        ),
      ).toBe(true);
    }
  });

  it("Enemy Melee steht bereits neben dem Knight → die Option „Angriff ohne Bewegung“ ist enthalten.", () => {
    const state = meleeVsKnight({ x: 4, y: 4 }, { x: 5, y: 4 });

    expect(attackOptions(state, 1)).toContainEqual({
      position: { x: 4, y: 4 },
      cost: 0,
      targetId: 2,
    });
  });

  it("WAIT und reine Bewegung sind nie in der Liste.", () => {
    const state = meleeVsKnight({ x: 0, y: 0 }, { x: 3, y: 3 });
    const options = attackOptions(state, 1);
    const enemyIds = state.units
      .filter(({ team }) => team === "player")
      .map(({ id }) => id);

    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(Object.keys(option).sort()).toEqual([
        "cost",
        "position",
        "targetId",
      ]);
      expect(enemyIds).toContain(option.targetId);
    }
  });

  it("Kein Ziel ist von irgendeinem erreichbaren Feld aus angreifbar → leere Liste.", () => {
    // Enemy Melee hat MOV 4 und Reichweite 1; der Knight ist 9 Felder entfernt.
    const state = meleeVsKnight({ x: 0, y: 0 }, { x: 9, y: 9 });

    expect(attackOptions(state, 1)).toEqual([]);
  });
});
