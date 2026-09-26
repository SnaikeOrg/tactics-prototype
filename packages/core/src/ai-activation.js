/**
 * @typedef {object} AiActivationPlan
 * @property {import("./turn-phases.js").TurnInput[]} inputs Eingaben der
 *   Aktivierung für `applyTurnInput`: optional MOVE, danach ACTION oder WAIT
 *   (§6).
 * @property {import("./resolve-action.js").Action | null} action Aktion für
 *   `resolveAction` nach ACTION, `null` bei WAIT.
 */

/**
 * Plant die Aktivierung einer Einheit nach der KI aus §23, ohne den
 * Spielzustand zu verändern.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {AiActivationPlan}
 */
export function planAiActivation(state, unitId) {
  void state;
  void unitId;
  throw new Error("not implemented");
}
