/**
 * @typedef {object} UnitView
 * @property {number} id Unit-ID (§5.1).
 * @property {string} className Name der Vorlage (§20, §21).
 * @property {string} team Anzeigename des Teams.
 * @property {boolean} isPlayer true für Spielerfiguren, false für Gegner.
 * @property {number} hp
 * @property {number} maxHp
 */

/**
 * @typedef {object} TileView
 * @property {number} x
 * @property {number} y
 * @property {import("../../core/src/grid.js").TerrainType} terrainType
 * @property {string} terrain Anzeigename des Geländes (§3).
 * @property {UnitView | null} unit
 */

/**
 * @typedef {object} BoardView
 * @property {number} columns
 * @property {number} rows
 * @property {TileView[]} tiles Zeilenweise ab (0,0), Index ist die Tile-ID (§2.3).
 */

/**
 * Macht aus einem Spielzustand ein Anzeigemodell für das Raster.
 *
 * @param {import("../../core/src/game-state.js").GameState} state
 * @returns {BoardView}
 */
export function createBoardView(state) {
  void state;
  throw new Error("not implemented");
}
