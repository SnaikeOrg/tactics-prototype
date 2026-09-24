/**
 * @typedef {object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} GameMap
 * @property {number} width
 * @property {number} height
 */

/**
 * @param {number} width
 * @param {number} height
 * @returns {GameMap}
 */
export function createMap(width, height) {
  void width;
  void height;
  throw new Error("not implemented");
}

/**
 * @param {GameMap} map
 * @param {Position} position
 * @returns {boolean}
 */
export function isInBounds(map, position) {
  void map;
  void position;
  throw new Error("not implemented");
}
