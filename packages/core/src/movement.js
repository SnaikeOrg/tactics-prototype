/**
 * @typedef {object} ReachableTile
 * @property {import("./grid.js").Position} position
 * @property {number} cost Bewegungskosten ab dem Standfeld (§3, §4).
 */

/**
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {ReachableTile[]}
 */
export function reachableTiles(state, unitId) {
  void state;
  void unitId;
  throw new Error("not implemented");
}
