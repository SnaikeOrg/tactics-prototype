/**
 * @typedef {object} GameState
 * @property {import("./grid.js").GameMap} map
 * @property {import("./unit.js").Unit[]} units
 */

/**
 * @param {{ map: import("./grid.js").GameMap, units: import("./unit.js").Unit[] }} input
 * @returns {GameState}
 */
export function createGameState(input) {
  void input;
  throw new Error("not implemented");
}
