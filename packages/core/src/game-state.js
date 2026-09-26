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

/** §18: Eine Einheit ist besiegt, sobald HP ≤ 0. */
const DEFEAT_HP = 0;

/**
 * §18: Eine Einheit mit diesen HP ist besiegt.
 *
 * @param {number} hp
 * @returns {boolean}
 */
export function isDefeated(hp) {
  return hp <= DEFEAT_HP;
}

/**
 * @typedef {object} DamageResult
 * @property {GameState} state
 * @property {boolean} defeated
 */

/**
 * Zieht einer Einheit Schaden von den aktuellen HP ab (§7). Fällt HP auf 0
 * oder darunter, wird sie aus dem Spielzustand gelöscht (§18). Der übergebene
 * Spielzustand bleibt unverändert.
 *
 * @param {GameState} state
 * @param {number} unitId
 * @param {number} damage
 * @returns {DamageResult}
 */
export function applyDamage(state, unitId, damage) {
  if (!Number.isInteger(damage) || damage < 0) {
    throw new TypeError("applyDamage: Schaden muss eine Ganzzahl ab 0 sein");
  }

  const target = state.units.find(({ id }) => id === unitId);
  if (!target) {
    throw new Error(`applyDamage: Unit-ID ${unitId} ist nicht im Spielzustand`);
  }

  const hp = target.hp - damage;
  // §18: besiegt bei HP ≤ 0, dann sofort aus dem Spielzustand gelöscht.
  const defeated = isDefeated(hp);
  const units = defeated
    ? state.units.filter(({ id }) => id !== unitId)
    : state.units.map((unit) => (unit.id === unitId ? { ...unit, hp } : unit));

  return { state: { map: state.map, units }, defeated };
}
