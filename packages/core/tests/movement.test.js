import { describe, expect, it } from "vitest";
import {
  applyDamage,
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
  reachableTiles,
} from "../src/index.js";

/** @typedef {import("../src/grid.js").TerrainType} TerrainType */

/** @returns {ReturnType<typeof loadUnitTemplates>[number]} */
function knightTemplate() {
  // §20.1: Knight hat MOV 4.
  const knight = loadUnitTemplates().find(({ id }) => id === "knight");
  if (!knight) {
    throw new Error("Knight-Vorlage fehlt");
  }
  return knight;
}

/**
 * @param {number} id
 * @param {"player" | "enemy"} team
 * @param {number} x
 * @param {number} y
 */
function knight(id, team, x, y) {
  return createUnit(knightTemplate(), { id, team, position: { x, y } });
}

/**
 * @param {ReturnType<typeof reachableTiles>} tiles
 * @param {number} x
 * @param {number} y
 * @returns {number | undefined}
 */
function costAt(tiles, x, y) {
  return tiles.find(({ position }) => position.x === x && position.y === y)
    ?.cost;
}

/**
 * Karte mit Ground überall, ausser an den angegebenen Feldern.
 *
 * @param {number} width
 * @param {number} height
 * @param {Array<[number, number, TerrainType]>} overrides
 */
function mapWith(width, height, overrides) {
  /** @type {TerrainType[]} */
  const tiles = Array.from({ length: width * height }, () => "GROUND");
  for (const [x, y, terrain] of overrides) {
    tiles[y * width + x] = terrain;
  }
  return createMap(width, height, tiles);
}

describe("reachableTiles", () => {
  it("Bei MOV 4 ist Ground → Forest → Ground (1 + 2 + 1 = 4) erreichbar, Ground → Forest → Forest (1 + 2 + 2 = 5) nicht.", () => {
    const groundForestGround = createGameState({
      map: createMap(4, 1, ["GROUND", "GROUND", "FOREST", "GROUND"]),
      units: [knight(1, "player", 0, 0)],
    });
    const groundForestForest = createGameState({
      map: createMap(4, 1, ["GROUND", "GROUND", "FOREST", "FOREST"]),
      units: [knight(1, "player", 0, 0)],
    });

    expect(costAt(reachableTiles(groundForestGround, 1), 3, 0)).toBe(4);
    expect(costAt(reachableTiles(groundForestForest, 1), 3, 0)).toBeUndefined();
  });

  it("Von (0,0) ist (1,1) auf Ground mit Kosten 1 erreichbar.", () => {
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, "player", 0, 0)],
    });

    expect(costAt(reachableTiles(state, 1), 1, 1)).toBe(1);
  });

  it("Ein Wall-Feld und ein von einer lebenden Einheit (eigenes oder gegnerisches Team) besetztes Feld sind weder erreichbar noch durchquerbar.", () => {
    const wall = createGameState({
      map: mapWith(3, 1, [[1, 0, "WALL"]]),
      units: [knight(1, "player", 0, 0)],
    });
    const ownUnit = createGameState({
      map: createMap(3, 1),
      units: [knight(1, "player", 0, 0), knight(2, "player", 1, 0)],
    });
    const enemyUnit = createGameState({
      map: createMap(3, 1),
      units: [knight(1, "player", 0, 0), knight(2, "enemy", 1, 0)],
    });

    for (const state of [wall, ownUnit, enemyUnit]) {
      const tiles = reachableTiles(state, 1);
      expect(costAt(tiles, 1, 0)).toBeUndefined();
      expect(costAt(tiles, 2, 0)).toBeUndefined();
    }
  });

  it("Der Schritt (0,0) → (1,1) ist verboten, wenn (1,0) oder (0,1) ein Wall ist oder von einer Einheit besetzt ist.", () => {
    const blockers = [
      createGameState({
        map: mapWith(10, 10, [[1, 0, "WALL"]]),
        units: [knight(1, "player", 0, 0)],
      }),
      createGameState({
        map: mapWith(10, 10, [[0, 1, "WALL"]]),
        units: [knight(1, "player", 0, 0)],
      }),
      createGameState({
        map: createMap(10, 10),
        units: [knight(1, "player", 0, 0), knight(2, "player", 1, 0)],
      }),
      createGameState({
        map: createMap(10, 10),
        units: [knight(1, "player", 0, 0), knight(2, "enemy", 0, 1)],
      }),
    ];

    for (const state of blockers) {
      expect(costAt(reachableTiles(state, 1), 1, 1)).not.toBe(1);
    }
  });

  it("Nachdem die Einheit auf (1,0) besiegt und entfernt wurde, blockiert (1,0) weder das Feld noch den Schritt (0,0) → (1,1).", () => {
    const before = createGameState({
      map: createMap(10, 10),
      units: [knight(1, "player", 0, 0), knight(2, "enemy", 1, 0)],
    });
    const blocker = before.units.find(({ id }) => id === 2);
    if (!blocker) {
      throw new Error("Einheit 2 fehlt");
    }
    const { state } = applyDamage(before, 2, blocker.hp);
    const tiles = reachableTiles(state, 1);

    expect(costAt(tiles, 1, 0)).toBe(1);
    expect(costAt(tiles, 1, 1)).toBe(1);
  });
});
