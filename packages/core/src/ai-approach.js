/**
 * @typedef {object} ApproachPlan
 * @property {number | null} targetId Unit-ID des gewählten Gegners, null ohne Pfad.
 * @property {import("./turn-phases.js").TurnInput[]} inputs Eingaben der
 *   Aktivierung: optional MOVE, danach immer WAIT (§6, §23.2).
 */

/**
 * Annäherung ohne Angriffsoption (§23.2). Voraussetzung: `attackOptions`
 * liefert für die Einheit keine Option.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {ApproachPlan}
 */
export function approachNearestEnemy(state, unitId) {
  void state;
  void unitId;
  throw new Error("not implemented");
}
