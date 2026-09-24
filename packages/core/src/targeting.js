/**
 * @typedef {object} TargetedAbility
 * @property {import("./unit.js").TargetType} target
 * @property {number} minRange
 * @property {number} maxRange
 */

/**
 * @param {import("./game-state.js").GameState} state
 * @param {number} attackerId
 * @param {TargetedAbility} ability
 * @param {number} targetId
 * @returns {boolean}
 */
export function isValidTarget(state, attackerId, ability, targetId) {
  void state;
  void attackerId;
  void ability;
  void targetId;
  throw new Error("not implemented");
}
