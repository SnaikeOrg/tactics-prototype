/**
 * @typedef {object} Combat
 * @property {import("./game-state.js").GameState} state Spielzustand.
 * @property {number} round Aktuelle Runde, ab 1 (§5).
 * @property {number | null} activeUnitId Unit-ID der aktiven Einheit, `null`, sobald Sieg oder Niederlage feststeht (§24).
 * @property {import("./combat-status.js").CombatStatus} status Kampfstatus nach §24.
 * @property {import("./initiative.js").Round} initiative Zugreihenfolge der aktuellen Runde (§5, §5.1).
 */

/**
 * Startet einen Kampf: Runde 1, Initiative nach §5 und §5.1, erste aktive
 * Einheit.
 *
 * @param {import("./game-state.js").GameState} state
 * @returns {Combat}
 */
export function startCombat(state) {
  void state;
  throw new Error("not implemented");
}

/**
 * Übernimmt den Spielzustand nach einer beendeten Aktivierung und bestimmt
 * die nächste aktive Einheit. Der übergebene Kampf bleibt unverändert.
 *
 * @param {Combat} combat
 * @param {import("./game-state.js").GameState} state
 * @returns {Combat}
 */
export function endActivation(combat, state) {
  void combat;
  void state;
  throw new Error("not implemented");
}
