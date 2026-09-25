/**
 * @typedef {"SIEG" | "NIEDERLAGE" | "ABBRUCH"} CombatResult
 */

/**
 * @typedef {{ type: "BASIC_ATTACK", targetId: number, damage: number }
 *   | { type: "WAIT" }} LoggedAction
 */

/**
 * @typedef {object} LogEntry
 * @property {number} round Runde der Aktivierung, ab 1.
 * @property {number} unitId Unit-ID der aktivierten Einheit.
 * @property {import("../../core/src/grid.js").Position} from Standfeld vor der Bewegung.
 * @property {import("../../core/src/grid.js").Position} to Standfeld nach der Bewegung, gleich `from` ohne Bewegung.
 * @property {LoggedAction} action
 * @property {number | null} targetHp HP des Ziels nach der Aktion, `null` bei WAIT. 0 oder weniger heisst besiegt (§18).
 */

/**
 * @typedef {object} CombatRun
 * @property {CombatResult} result
 * @property {number} rounds Anzahl gespielter Runden.
 * @property {LogEntry[]} log Eine Zeile pro Aktivierung.
 * @property {import("../../core/src/game-state.js").GameState} state Endzustand.
 */

/**
 * Wirft, wenn `applyTurnInput` oder `resolveAction` eine Eingabe abgelehnt hat.
 *
 * @template {{ accepted: boolean }} T
 * @param {T} result
 * @param {string} context
 * @returns {T}
 */
export function requireAccepted(result, context) {
  void result;
  void context;
  throw new Error("not implemented");
}

/**
 * Spielt den Greybox-Level (§25) KI gegen KI durch (§5, §6, §23, §24).
 *
 * @param {{ roundLimit: number }} options
 * @returns {CombatRun}
 */
export function runCombat(options) {
  void options;
  throw new Error("not implemented");
}
