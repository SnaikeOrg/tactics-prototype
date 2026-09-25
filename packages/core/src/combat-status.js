/**
 * @typedef {"victory" | "defeat" | "ongoing"} CombatStatus
 */

/**
 * Bestimmt den Kampfstatus nach §24: Sieg, sobald keine gegnerische Einheit
 * mehr im Spielzustand ist; Niederlage, sobald keine Spielerfigur mehr im
 * Spielzustand ist; sonst läuft der Kampf.
 *
 * @param {import("./game-state.js").GameState} state
 * @returns {CombatStatus}
 */
export function combatStatus(state) {
  void state;
  throw new Error("not implemented");
}
