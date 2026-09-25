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
  // §24 i. V. m. §18: besiegte Einheiten sind aus dem Spielzustand gelöscht,
  // also zählt jede Einheit im Spielzustand als lebend.
  const hasTeam = (/** @type {import("./unit.js").Team} */ team) =>
    state.units.some((unit) => unit.team === team);

  if (!hasTeam("enemy")) {
    return "victory";
  }
  if (!hasTeam("player")) {
    return "defeat";
  }
  return "ongoing";
}
