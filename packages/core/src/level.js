import greybox from "../data/greybox-level.json" with { type: "json" };
import { TERRAIN, createMap } from "./grid.js";
import { createGameState } from "./game-state.js";
import { createUnit, loadUnitTemplates } from "./unit.js";

/**
 * @typedef {object} LevelData
 * @property {string} id
 * @property {number} width
 * @property {number} height
 * @property {Record<string, import("./grid.js").TerrainType>} legend
 * @property {string[]} rows Eine Zeichenkette pro Zeile, Felder durch Leerzeichen getrennt.
 * @property {Record<string, string>} spawns Unit-ID → Vorlagen-ID (§5.1).
 */

/** §25: Ziffern sind Spawn-Felder auf Ground. */
const SPAWN_TERRAIN = "GROUND";

/**
 * Baut einen Spielzustand aus Leveldaten. Die Unit-IDs vergibt der
 * Level-Aufbau (§5.1): Die Ziffer auf dem Spawn-Feld ist die Unit-ID, das
 * Team folgt aus der Vorlage.
 *
 * @param {LevelData} level
 * @returns {import("./game-state.js").GameState}
 */
function buildLevel(level) {
  const templates = loadUnitTemplates();
  /** @type {import("./grid.js").TerrainType[]} */
  const tiles = [];
  /** @type {import("./unit.js").Unit[]} */
  const units = [];

  if (level.rows.length !== level.height) {
    throw new RangeError(
      `buildLevel: ${level.height} Zeilen erwartet, ${level.rows.length} erhalten`,
    );
  }

  level.rows.forEach((row, y) => {
    const cells = row.split(" ");
    if (cells.length !== level.width) {
      throw new RangeError(
        `buildLevel: Zeile ${y} hat ${cells.length} statt ${level.width} Felder`,
      );
    }

    cells.forEach((cell, x) => {
      const terrain = level.legend[cell];
      if (terrain !== undefined && Object.hasOwn(TERRAIN, terrain)) {
        tiles.push(terrain);
        return;
      }

      const templateId = level.spawns[cell];
      if (templateId === undefined) {
        throw new TypeError(`buildLevel: unbekanntes Zeichen ${cell}`);
      }
      const template = templates.find(({ id }) => id === templateId);
      if (!template) {
        throw new Error(`buildLevel: Vorlage ${templateId} fehlt`);
      }

      tiles.push(SPAWN_TERRAIN);
      units.push(
        createUnit(template, {
          id: Number(cell),
          team: template.faction,
          position: { x, y },
        }),
      );
    });
  });

  units.sort((a, b) => a.id - b.id);
  return createGameState({
    map: createMap(level.width, level.height, tiles),
    units,
  });
}

/**
 * Baut den Spielzustand der ersten Testmission aus
 * `packages/core/data/greybox-level.json` (§25). Die Unit-IDs vergibt der
 * Level-Aufbau (§5.1): Die Ziffer auf dem Spawn-Feld ist die Unit-ID.
 *
 * @returns {import("./game-state.js").GameState}
 */
export function createGreyboxLevel() {
  return buildLevel(/** @type {LevelData} */ (greybox));
}
