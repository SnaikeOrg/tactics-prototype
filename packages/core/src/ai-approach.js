import { isInBounds, tileId } from "./grid.js";
import { pathCosts } from "./movement.js";

/**
 * @typedef {object} ApproachPlan
 * @property {number | null} targetId Unit-ID des gewählten Gegners, null ohne Pfad.
 * @property {import("./turn-phases.js").TurnInput[]} inputs Eingaben der
 *   Aktivierung: optional MOVE, danach immer WAIT (§6, §23.2).
 */

/** §2.2: die acht angrenzenden Felder. */
const NEIGHBOURS = Object.freeze([
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
 * Tile-IDs der Felder innerhalb der Karte, die an `position` angrenzen (§2.2).
 *
 * @param {import("./grid.js").GameMap} map
 * @param {import("./grid.js").Position} position
 * @returns {number[]}
 */
function adjacentTileIds(map, position) {
  return NEIGHBOURS.map(({ dx, dy }) => ({
    x: position.x + dx,
    y: position.y + dy,
  }))
    .filter((next) => isInBounds(map, next))
    .map((next) => tileId(map, next));
}

/**
 * Geringste Pfadkosten aus `costs` bis zu einem der Felder `goals`.
 *
 * @param {Map<number, import("./movement.js").ReachableTile>} costs
 * @param {readonly number[]} goals
 * @returns {number}
 */
function costToGoals(costs, goals) {
  return Math.min(...goals.map((goal) => costs.get(goal)?.cost ?? Infinity));
}

/**
 * Annäherung ohne Angriffsoption (§23.2). Voraussetzung: `attackOptions`
 * liefert für die Einheit keine Option.
 *
 * Nächster Gegner ist der mit den geringsten Pfadkosten bis zu einem an ihn
 * angrenzenden Feld, bei Gleichstand die niedrigere Unit-ID. Ohne Pfad zu
 * irgendeinem Gegner: WAIT. Sonst MOVE auf das mit MOV erreichbare Feld eines
 * kürzesten Pfads mit den geringsten verbleibenden Pfadkosten, bei
 * Gleichstand die niedrigere Tile-ID, danach WAIT. Ohne Zufall.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {ApproachPlan}
 */
export function approachNearestEnemy(state, unitId) {
  const { map } = state;
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(
      `approachNearestEnemy: Unit-ID ${unitId} ist nicht im Spielzustand`,
    );
  }

  const fromStart = pathCosts(state, unitId, Infinity);
  const enemies = state.units
    .filter(({ team }) => team !== unit.team)
    .map((enemy) => {
      const goals = adjacentTileIds(map, enemy.position);
      return { id: enemy.id, goals, cost: costToGoals(fromStart, goals) };
    })
    .filter(({ cost }) => Number.isFinite(cost))
    .sort((a, b) => a.cost - b.cost || a.id - b.id);

  const target = enemies[0];
  if (!target) {
    return { targetId: null, inputs: [{ type: "WAIT" }] };
  }

  /** @type {{ position: import("./grid.js").Position, id: number, rest: number } | null} */
  let best = null;
  for (const [id, { position, cost }] of fromStart) {
    if (cost > unit.stats.mov) {
      continue;
    }
    const moved = {
      map,
      units: state.units.map((other) =>
        other.id === unitId ? { ...other, position } : other,
      ),
    };
    const rest = costToGoals(pathCosts(moved, unitId, Infinity), target.goals);
    // Nur Felder auf einem kürzesten Pfad zum gewählten Gegner.
    if (cost + rest !== target.cost) {
      continue;
    }
    if (!best || rest < best.rest || (rest === best.rest && id < best.id)) {
      best = { position, id, rest };
    }
  }

  // Das eigene Feld liegt immer auf einem kürzesten Pfad, `best` ist also gesetzt.
  if (!best || best.id === tileId(map, unit.position)) {
    return { targetId: target.id, inputs: [{ type: "WAIT" }] };
  }
  return {
    targetId: target.id,
    inputs: [
      { type: "MOVE", to: { x: best.position.x, y: best.position.y } },
      { type: "WAIT" },
    ],
  };
}
