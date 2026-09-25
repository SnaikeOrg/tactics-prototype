/**
 * @typedef {{ type: "BASIC_ATTACK", attackerId: number, targetId: number }} Action
 */

/**
 * @typedef {object} ActionResult
 * @property {boolean} accepted
 * @property {import("./game-state.js").GameState} state
 */

/**
 * Löst eine Aktion auf und verändert den Spielzustand (§15, §22).
 *
 * @param {import("./game-state.js").GameState} state
 * @param {Action} action
 * @returns {ActionResult}
 */
export function resolveAction(state, action) {
  void state;
  void action;
  throw new Error("not implemented");
}
