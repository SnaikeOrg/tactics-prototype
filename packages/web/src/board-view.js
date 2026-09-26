import { loadUnitTemplates, tileId } from "@tactics/core";

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
 * §3: Anzeigenamen des Geländes.
 *
 * @type {Readonly<Record<import("../../core/src/grid.js").TerrainType, string>>}
 */
const TERRAIN_LABELS = Object.freeze({
  GROUND: "Ground", // §3.1
  FOREST: "Forest", // §3.2
  HIGH_GROUND: "High Ground", // §3.3
  WALL: "Wall", // §3.4
});

/**
 * §20 Spielerfiguren, §21 Gegner: Anzeigenamen der Teams.
 *
 * @type {Readonly<Record<import("../../core/src/unit.js").Team, string>>}
 */
const TEAM_LABELS = Object.freeze({
  player: "Spieler",
  enemy: "Gegner",
});

/**
 * Macht aus einem Spielzustand ein Anzeigemodell für das Raster.
 *
 * @param {import("../../core/src/game-state.js").GameState} state
 * @returns {BoardView}
 */
export function createBoardView(state) {
  const { map, units } = state;
  const templates = loadUnitTemplates();

  /** @type {Map<number, UnitView>} */
  const unitsByTile = new Map();
  for (const unit of units) {
    const template = templates.find(({ id }) => id === unit.templateId);
    if (!template) {
      throw new Error(`createBoardView: Vorlage ${unit.templateId} fehlt`);
    }
    unitsByTile.set(tileId(map, unit.position), {
      id: unit.id,
      className: template.name,
      team: TEAM_LABELS[unit.team],
      isPlayer: unit.team === "player",
      hp: unit.hp,
      maxHp: unit.maxHp,
    });
  }

  const tiles = map.tiles.map((terrainType, index) => ({
    x: index % map.width,
    y: Math.floor(index / map.width),
    terrainType,
    terrain: TERRAIN_LABELS[terrainType],
    unit: unitsByTile.get(index) ?? null,
  }));

  return { columns: map.width, rows: map.height, tiles };
}
