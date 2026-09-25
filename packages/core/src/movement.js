import { isInBounds, terrainAt, tileId } from "./grid.js";

/**
 * @typedef {object} ReachableTile
 * @property {import("./grid.js").Position} position
 * @property {number} cost Bewegungskosten ab dem Standfeld (§3, §4).
 */

/** §2: Bewegung in acht Richtungen. */
const DIRECTIONS = Object.freeze([
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 },
]);

/**
 * Kürzeste Bewegungskosten (§3, §4) vom Standfeld der Einheit zu jedem Feld
 * bis höchstens `maxCost`, als Map Tile-ID → Feld. Walls und Felder mit
 * Einheiten beider Teams sind weder Ziel noch Durchgang, Ecken schneiden ist
 * verboten. Das eigene Standfeld ist mit Kosten 0 enthalten.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @param {number} maxCost
 * @returns {Map<number, ReachableTile>}
 */
export function pathCosts(state, unitId, maxCost) {
  const { map } = state;
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(`pathCosts: Unit-ID ${unitId} ist nicht im Spielzustand`);
  }

  const occupied = new Set(
    state.units.map(({ position }) => tileId(map, position)),
  );

  /** @param {import("./grid.js").Position} position */
  const isOpen = (position) =>
    isInBounds(map, position) &&
    terrainAt(map, position).walkable &&
    !occupied.has(tileId(map, position));

  const startId = tileId(map, unit.position);
  /** @type {Map<number, ReachableTile>} */
  const best = new Map([[startId, { position: unit.position, cost: 0 }]]);
  /** @type {ReachableTile[]} */
  const frontier = [{ position: unit.position, cost: 0 }];

  while (frontier.length > 0) {
    // Kleinste Kosten zuerst (Dijkstra); die Karten in V0.1 sind klein.
    frontier.sort((a, b) => a.cost - b.cost);
    const current = /** @type {ReachableTile} */ (frontier.shift());
    if (
      current.cost > (best.get(tileId(map, current.position))?.cost ?? Infinity)
    ) {
      continue;
    }

    for (const { dx, dy } of DIRECTIONS) {
      const next = { x: current.position.x + dx, y: current.position.y + dy };
      if (!isOpen(next)) {
        continue;
      }
      // §4: Ecken schneiden verboten; beide orthogonalen Nachbarn müssen frei sein.
      if (
        dx !== 0 &&
        dy !== 0 &&
        (!isOpen({ x: next.x, y: current.position.y }) ||
          !isOpen({ x: current.position.x, y: next.y }))
      ) {
        continue;
      }

      const cost =
        current.cost +
        /** @type {number} */ (terrainAt(map, next).movementCost);
      const nextId = tileId(map, next);
      if (cost > maxCost || cost >= (best.get(nextId)?.cost ?? Infinity)) {
        continue;
      }
      best.set(nextId, { position: next, cost });
      frontier.push({ position: next, cost });
    }
  }

  return best;
}

/**
 * Alle Felder, die die Einheit mit ihrem MOV erreicht, samt Kosten (§4).
 * Walls und Felder mit Einheiten beider Teams sind weder Ziel noch Durchgang,
 * Ecken schneiden ist verboten. Das eigene Standfeld ist nicht enthalten.
 * Sortiert nach Tile-ID (§2.3).
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {ReachableTile[]}
 */
export function reachableTiles(state, unitId) {
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(
      `reachableTiles: Unit-ID ${unitId} ist nicht im Spielzustand`,
    );
  }

  const best = pathCosts(state, unitId, unit.stats.mov);
  best.delete(tileId(state.map, unit.position));
  return [...best.entries()].sort(([a], [b]) => a - b).map(([, tile]) => tile);
}
