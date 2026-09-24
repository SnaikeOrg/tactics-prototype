import { chebyshevDistance } from "./grid.js";

/**
 * @typedef {object} TargetedAbility
 * @property {import("./unit.js").TargetType} target
 * @property {number} minRange
 * @property {number} maxRange
 */

/**
 * Prüft ein Ziel für eine Fähigkeit mit Zieltyp ENEMY (§9): Das Ziel ist eine
 * gegnerische Einheit im Spielzustand (§18) und liegt in minRange bis
 * maxRange, gemessen mit der Chebyshev-Distanz (§2.1, §8).
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} attackerId
 * @param {TargetedAbility} ability
 * @param {number} targetId
 * @returns {boolean}
 */
export function isValidTarget(state, attackerId, ability, targetId) {
  if (ability.target !== "ENEMY") {
    throw new Error(
      `isValidTarget: Zieltyp ${ability.target} wird noch nicht unterstützt`,
    );
  }

  const attacker = state.units.find(({ id }) => id === attackerId);
  if (!attacker) {
    throw new Error(
      `isValidTarget: Unit-ID ${attackerId} ist nicht im Spielzustand`,
    );
  }

  // §18: Besiegte Einheiten sind nicht mehr im Spielzustand.
  const target = state.units.find(({ id }) => id === targetId);
  if (!target || target.team === attacker.team) {
    return false;
  }

  const distance = chebyshevDistance(attacker.position, target.position);
  return distance >= ability.minRange && distance <= ability.maxRange;
}
