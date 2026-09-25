/**
 * @typedef {object} ActivationPhase
 * @property {number} unitId Unit-ID der aktivierten Einheit.
 * @property {boolean} moved Movement dieser Aktivierung verbraucht (§6).
 * @property {boolean} ended Aktivierung beendet, nach ACTION oder WAIT (§6).
 */

/**
 * @typedef {{ type: "MOVE", to: import("./grid.js").Position }
 *   | { type: "ACTION" }
 *   | { type: "WAIT" }} TurnInput
 */

/**
 * @typedef {object} TurnInputResult
 * @property {boolean} accepted
 * @property {import("./game-state.js").GameState} state
 * @property {ActivationPhase} activation
 */

/**
 * Beginnt eine Aktivierung mit unverbrauchtem Movement und Action (§6).
 *
 * @param {number} unitId
 * @returns {ActivationPhase}
 */
export function beginActivation(unitId) {
  void unitId;
  throw new Error("not implemented");
}

/**
 * Wendet eine Eingabe innerhalb einer Aktivierung an (§6).
 *
 * @param {import("./game-state.js").GameState} state
 * @param {ActivationPhase} activation
 * @param {TurnInput} input
 * @returns {TurnInputResult}
 */
export function applyTurnInput(state, activation, input) {
  void state;
  void activation;
  void input;
  throw new Error("not implemented");
}
