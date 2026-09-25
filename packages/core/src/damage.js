/**
 * @typedef {object} DamagingAbility
 * @property {import("./unit.js").DamageType} damageType
 * @property {number} multiplier SkillMultiplier (§12, §13).
 */

/**
 * @typedef {Pick<import("./unit.js").Stats, "atk" | "mag">} OffensiveStats
 * @typedef {Pick<import("./unit.js").Stats, "def" | "res">} DefensiveStats
 */

/**
 * Berechnet den Schaden einer Fähigkeit ohne Final-Damage-Boni:
 * physisch nach §12, magisch nach §13. Ändert keinen Spielzustand, damit
 * `resolveAction()` und `previewAction()` dieselbe Berechnung nutzen (§22).
 *
 * @param {OffensiveStats} attacker
 * @param {DefensiveStats} defender
 * @param {DamagingAbility} ability
 * @returns {number}
 */
export function calculateDamage(attacker, defender, ability) {
  void attacker;
  void defender;
  void ability;
  throw new Error("not implemented");
}
