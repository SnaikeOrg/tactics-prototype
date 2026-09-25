/**
 * @typedef {object} Round
 * @property {number[]} order Unit-IDs in der zu Rundenbeginn festgelegten Zugreihenfolge (§5).
 * @property {number} next Index der nächsten noch nicht geprüften Position in `order`.
 */

/**
 * @typedef {object} Activation
 * @property {number | null} unitId Unit-ID der aktivierten Einheit, `null`, wenn die Runde vorbei ist.
 * @property {Round} round
 */

/**
 * Legt zu Beginn einer Runde die Initiative aller lebenden Einheiten fest
 * (§5, §5.1).
 *
 * @param {import("./game-state.js").GameState} state
 * @returns {Round}
 */
export function startRound(state) {
  void state;
  throw new Error("not implemented");
}

/**
 * Liefert die nächste Aktivierung der Runde. Einheiten, die nicht mehr im
 * Spielzustand sind, werden übersprungen (§18).
 *
 * @param {import("./game-state.js").GameState} state
 * @param {Round} round
 * @returns {Activation}
 */
export function nextActivation(state, round) {
  void state;
  void round;
  throw new Error("not implemented");
}
