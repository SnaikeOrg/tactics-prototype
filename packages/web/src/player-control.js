/**
 * @typedef {object} PlayerControl
 * @property {import("../../core/src/combat-flow.js").Combat} combat Laufender Kampf (§5, §24).
 * @property {import("../../core/src/turn-phases.js").ActivationPhase | null} activation Aktivierung der aktiven Spielerfigur (§6), `null`, wenn keine Einheit aktiv ist.
 */

/**
 * @typedef {{ type: "CLICK_TILE", position: import("../../core/src/grid.js").Position }
 *   | { type: "WAIT" }} ControlInput
 */

/**
 * @typedef {object} ControlView
 * @property {number} round Rundennummer (§5).
 * @property {number[]} initiativeOrder Zugreihenfolge der laufenden Runde (§5, §5.1).
 * @property {number | null} activeUnitId Unit-ID der aktiven Spielerfigur.
 * @property {import("../../core/src/grid.js").Position[]} movableTiles Zur Bewegung markierte Felder (§4, §6).
 */

/**
 * Startet den Kampf und beendet gegnerische Aktivierungen ohne Eingabe, bis
 * eine Spielerfigur aktiv ist.
 *
 * @param {import("../../core/src/game-state.js").GameState} state
 * @returns {PlayerControl}
 */
export function startPlayerControl(state) {
  void state;
  throw new Error("not implemented");
}

/**
 * Wendet eine Eingabe des Menschen an. Der übergebene Zustand bleibt
 * unverändert.
 *
 * @param {PlayerControl} control
 * @param {ControlInput} input
 * @returns {PlayerControl}
 */
export function applyControlInput(control, input) {
  void control;
  void input;
  throw new Error("not implemented");
}

/**
 * Anzeigedaten der Steuerung: Runde, Initiative, aktive Einheit, markierte
 * Felder.
 *
 * @param {PlayerControl} control
 * @returns {ControlView}
 */
export function createControlView(control) {
  void control;
  throw new Error("not implemented");
}
