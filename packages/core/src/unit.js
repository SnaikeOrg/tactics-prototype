/**
 * @typedef {object} UnitTemplate
 * @property {string} id
 * @property {{ hp: number, atk: number, def: number, mag: number, res: number, spd: number, mov: number }} stats
 * @property {{ target: string, minRange: number, maxRange: number, damageType: string, multiplier: number, area: string }} basicAttack
 */

/**
 * @typedef {object} Unit
 * @property {number} id
 */

/**
 * @returns {UnitTemplate[]}
 */
export function loadUnitTemplates() {
  throw new Error("not implemented");
}

/**
 * @param {UnitTemplate} template
 * @param {{ id: number, team: string, position: import("./grid.js").Position }} init
 * @returns {Unit}
 */
export function createUnit(template, init) {
  void template;
  void init;
  throw new Error("not implemented");
}
