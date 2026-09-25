/**
 * @typedef {object} AttackOption
 * @property {import("./grid.js").Position} position Standfeld der Angriffsoption.
 * @property {number} cost Bewegungskosten bis zum Standfeld, 0 ohne Bewegung (§4).
 * @property {number} targetId Unit-ID des Ziels der Basic Attack.
 */

/**
 * Alle Angriffsoptionen einer Einheit zu Beginn ihres Zugs (§23): jede legale
 * Kombination aus Bewegung (auch keine Bewegung) und Basic Attack, die eine
 * gegnerische Einheit trifft. WAIT und reine Bewegung sind keine
 * Angriffsoptionen.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {AttackOption[]}
 */
export function attackOptions(state, unitId) {
  void state;
  void unitId;
  throw new Error("not implemented");
}
