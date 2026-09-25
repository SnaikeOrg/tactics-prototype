/** §12, §13: Mindestschaden eines Treffers. */
const MIN_DAMAGE = 1;

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
  const raw =
    ability.damageType === "MAGIC"
      ? // §13
        attacker.mag * ability.multiplier - defender.res
      : // §12
        attacker.atk * ability.multiplier - defender.def;

  // §14: nach jedem Berechnungsschritt abrunden.
  return Math.max(MIN_DAMAGE, Math.floor(raw));
}
