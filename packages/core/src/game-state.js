import { isInBounds, terrainAt, tileId } from "./grid.js";

/**
 * @typedef {object} GameState
 * @property {import("./grid.js").GameMap} map
 * @property {import("./unit.js").Unit[]} units
 */

/**
 * Prüft die Invarianten aus §4 und §5.1: eindeutige Unit-IDs, Einheiten auf
 * begehbaren Feldern innerhalb der Karte, nie zwei Einheiten auf einem Feld.
 *
 * @param {{ map: import("./grid.js").GameMap, units: import("./unit.js").Unit[] }} input
 * @returns {GameState}
 */
export function createGameState({ map, units }) {
  /** @type {Set<number>} */
  const ids = new Set();
  /** @type {Set<number>} */
  const occupied = new Set();

  for (const unit of units) {
    const { x, y } = unit.position;

    if (ids.has(unit.id)) {
      throw new Error(
        `createGameState: Unit-ID ${unit.id} ist doppelt vergeben`,
      );
    }
    ids.add(unit.id);

    if (!isInBounds(map, unit.position)) {
      throw new RangeError(
        `createGameState: Feld (${x},${y}) liegt ausserhalb der Karte`,
      );
    }
    if (!terrainAt(map, unit.position).walkable) {
      throw new Error(`createGameState: Feld (${x},${y}) ist nicht begehbar`);
    }

    const id = tileId(map, unit.position);
    if (occupied.has(id)) {
      throw new Error(`createGameState: Feld (${x},${y}) ist bereits besetzt`);
    }
    occupied.add(id);
  }

  return { map, units: [...units] };
}

/**
 * @typedef {object} DamageResult
 * @property {GameState} state
 * @property {boolean} defeated
 */

/**
 * @param {GameState} state
 * @param {number} unitId
 * @param {number} damage
 * @returns {DamageResult}
 */
export function applyDamage(state, unitId, damage) {
  void state;
  void unitId;
  void damage;
  throw new Error("not implemented");
}
