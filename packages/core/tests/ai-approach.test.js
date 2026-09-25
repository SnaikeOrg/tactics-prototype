import { describe, expect, it } from "vitest";
import {
  applyTurnInput,
  approachNearestEnemy,
  attackOptions,
  beginActivation,
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
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
 * @param {number} id
 * @param {{ x: number, y: number }} position
 */
function knight(id, position) {
  return createUnit(template("knight"), { id, team: "player", position });
}

/**
 * Enemy Melee: MOV 4, Reichweite 1 (§21.1).
 *
 * @param {number} id
 * @param {{ x: number, y: number }} position
 */
function enemyMelee(id, position) {
  return createUnit(template("enemy-melee"), { id, team: "enemy", position });
}

/**
 * Karte mit Ground und Walls an den angegebenen Feldern.
 *
 * @param {number} width
 * @param {number} height
 * @param {readonly { x: number, y: number }[]} walls
 */
function mapWithWalls(width, height, walls) {
  /** @type {import("../src/grid.js").TerrainType[]} */
  const tiles = Array.from({ length: width * height }, () => "GROUND");
  for (const { x, y } of walls) {
    tiles[y * width + x] = "WALL";
  }
  return createMap(width, height, tiles);
}

describe("approachNearestEnemy", () => {
  it("Gegner A ist nach Chebyshev-Distanz näher als Gegner B, liegt aber hinter einer Wall mit höheren Pfadkosten → B wird gewählt.", () => {
    // Wall-Reihe y = 1 von x = 0 bis 8; A auf (4,0) ist nur über (9,1) erreichbar.
    const walls = Array.from({ length: 9 }, (_, x) => ({ x, y: 1 }));
    const state = createGameState({
      map: mapWithWalls(10, 10, walls),
      units: [
        knight(1, { x: 4, y: 0 }),
        knight(2, { x: 4, y: 9 }),
        enemyMelee(3, { x: 4, y: 3 }),
      ],
    });
    expect(attackOptions(state, 3)).toEqual([]);

    // Chebyshev: A 3, B 6. Pfadkosten bis angrenzend: A 11, B 5.
    expect(approachNearestEnemy(state, 3).targetId).toBe(2);
  });

  it("Gleiche Pfadkosten zu Gegnern mit Unit-ID 2 und 3 → Gegner 2 wird gewählt.", () => {
    const state = createGameState({
      map: createMap(20, 10),
      units: [
        knight(1, { x: 10, y: 9 }),
        knight(2, { x: 16, y: 0 }),
        knight(3, { x: 4, y: 0 }),
        enemyMelee(4, { x: 10, y: 0 }),
      ],
    });
    expect(attackOptions(state, 4)).toEqual([]);

    // Pfadkosten bis angrenzend: Einheit 1 8, Einheit 2 5, Einheit 3 5.
    expect(approachNearestEnemy(state, 4).targetId).toBe(2);
  });

  it("Es gibt zu keinem Gegner einen Pfad → WAIT.", () => {
    const state = createGameState({
      map: mapWithWalls(10, 10, [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]),
      units: [knight(1, { x: 5, y: 5 }), enemyMelee(2, { x: 0, y: 0 })],
    });
    expect(attackOptions(state, 2)).toEqual([]);

    expect(approachNearestEnemy(state, 2)).toEqual({
      targetId: null,
      inputs: [{ type: "WAIT" }],
    });
  });

  it("Zwei erreichbare Felder mit gleichen Restkosten → das Feld mit der niedrigeren Tile-ID wird gewählt.", () => {
    // 10×2-Karte: (4,0) und (4,1) kosten je 4 und haben je Restkosten 4 bis (8,*).
    const state = createGameState({
      map: createMap(10, 2),
      units: [knight(1, { x: 9, y: 1 }), enemyMelee(2, { x: 0, y: 1 })],
    });
    expect(attackOptions(state, 2)).toEqual([]);

    expect(approachNearestEnemy(state, 2).inputs[0]).toEqual({
      type: "MOVE",
      to: { x: 4, y: 0 },
    });
  });

  it("Nach der Bewegung endet die Aktivierung ohne Aktion.", () => {
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, { x: 9, y: 5 }), enemyMelee(2, { x: 0, y: 5 })],
    });
    expect(attackOptions(state, 2)).toEqual([]);

    const { inputs } = approachNearestEnemy(state, 2);
    expect(inputs[0].type).toBe("MOVE");
    expect(inputs.some(({ type }) => type === "ACTION")).toBe(false);

    let current = state;
    let activation = beginActivation(2);
    for (const input of inputs) {
      const result = applyTurnInput(current, activation, input);
      expect(result.accepted).toBe(true);
      current = result.state;
      activation = result.activation;
    }
    expect(activation.ended).toBe(true);
  });
});
