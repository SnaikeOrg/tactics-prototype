/**
 * @typedef {object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {"GROUND" | "FOREST" | "HIGH_GROUND" | "WALL"} TerrainType
 */

/**
 * @typedef {object} Terrain
 * @property {number | null} movementCost null, wenn nicht begehbar.
 * @property {boolean} walkable
 */

/** @type {Readonly<Record<TerrainType, Readonly<Terrain>>>} */
export const TERRAIN = Object.freeze({
  // §3.1
  GROUND: Object.freeze({ movementCost: 1, walkable: true }),
  // §3.2
  FOREST: Object.freeze({ movementCost: 2, walkable: true }),
  // §3.3
  HIGH_GROUND: Object.freeze({ movementCost: 1, walkable: true }),
  // §3.4
  WALL: Object.freeze({ movementCost: null, walkable: false }),
});

/**
 * @typedef {object} GameMap
 * @property {number} width
 * @property {number} height
 * @property {readonly TerrainType[]} tiles Index ist die Tile-ID (§2.3).
 */

/**
 * @param {number} width
 * @param {number} height
 * @param {readonly TerrainType[]} [tiles] Zeilenweise ab (0,0); Standard Ground.
 * @returns {GameMap}
 */
export function createMap(width, height, tiles) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new TypeError(
      "createMap(width, height) erwartet positive Ganzzahlen",
    );
  }

  const size = width * height;
  const cells =
    tiles ??
    Array.from({ length: size }, () => /** @type {TerrainType} */ ("GROUND"));

  if (cells.length !== size) {
    throw new RangeError(
      `createMap: ${size} Felder erwartet, ${cells.length} erhalten`,
    );
  }
  for (const cell of cells) {
    if (!Object.hasOwn(TERRAIN, cell)) {
      throw new TypeError(`createMap: unbekanntes Gelände ${cell}`);
    }
  }

  return Object.freeze({ width, height, tiles: Object.freeze([...cells]) });
}

/**
 * @param {GameMap} map
 * @param {Position} position
 * @returns {boolean}
 */
export function isInBounds(map, position) {
  return (
    Number.isInteger(position.x) &&
    Number.isInteger(position.y) &&
    position.x >= 0 &&
    position.y >= 0 &&
    position.x < map.width &&
    position.y < map.height
  );
}

/**
 * §2.3: Tile-ID = y × Kartenbreite + x.
 *
 * @param {GameMap} map
 * @param {Position} position
 * @returns {number}
 */
export function tileId(map, position) {
  if (!isInBounds(map, position)) {
    throw new RangeError(
      `tileId: (${position.x},${position.y}) liegt ausserhalb der Karte`,
    );
  }

  return position.y * map.width + position.x;
}

/**
 * @param {GameMap} map
 * @param {Position} position
 * @returns {Readonly<Terrain>}
 */
export function terrainAt(map, position) {
  return TERRAIN[map.tiles[tileId(map, position)]];
}

/**
 * §2.1: Chebyshev-Distanz.
 *
 * @param {Position} a
 * @param {Position} b
 * @returns {number}
 */
export function chebyshevDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * §2.2: angrenzend heisst Chebyshev-Distanz genau 1.
 *
 * @param {Position} a
 * @param {Position} b
 * @returns {boolean}
 */
export function isAdjacent(a, b) {
  return chebyshevDistance(a, b) === 1;
}
