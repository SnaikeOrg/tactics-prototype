import {
  applyTurnInput,
  beginActivation,
  endActivation,
  reachableTiles,
  startCombat,
} from "@tactics/core";

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
  return skipEnemyActivations(startCombat(state));
}

/**
 * Übergangslösung bis zu den Gegnerzügen: gegnerische Aktivierungen enden
 * ohne Eingabe, bis eine Spielerfigur aktiv ist oder der Kampf entschieden
 * ist (§24).
 *
 * @param {import("../../core/src/combat-flow.js").Combat} combat
 * @returns {PlayerControl}
 */
function skipEnemyActivations(combat) {
  let current = combat;
  while (current.activeUnitId !== null) {
    const activeId = current.activeUnitId;
    const unit = current.state.units.find(({ id }) => id === activeId);
    if (unit?.team === "player") {
      return { combat: current, activation: beginActivation(activeId) };
    }
    current = endActivation(current, current.state);
  }
  return { combat: current, activation: null };
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
  const { combat, activation } = control;
  if (activation === null) {
    return control;
  }

  /** @type {import("../../core/src/turn-phases.js").TurnInput} */
  const turnInput =
    input.type === "CLICK_TILE"
      ? { type: "MOVE", to: input.position }
      : { type: "WAIT" };
  const result = applyTurnInput(combat.state, activation, turnInput);
  if (!result.accepted) {
    return control;
  }

  // §6: Nach WAIT endet die Aktivierung, die nächste Einheit ist dran (§5).
  if (result.activation.ended) {
    return skipEnemyActivations(endActivation(combat, result.state));
  }
  return {
    combat: { ...combat, state: result.state },
    activation: result.activation,
  };
}

/**
 * Anzeigedaten der Steuerung: Runde, Initiative, aktive Einheit, markierte
 * Felder.
 *
 * @param {PlayerControl} control
 * @returns {ControlView}
 */
export function createControlView(control) {
  const { combat, activation } = control;
  // §6: genau einmal Movement pro Aktivierung.
  const movableTiles =
    activation === null || activation.moved || activation.ended
      ? []
      : reachableTiles(combat.state, activation.unitId).map(
          ({ position }) => position,
        );

  return {
    round: combat.round,
    initiativeOrder: [...combat.initiative.order],
    activeUnitId: activation === null ? null : activation.unitId,
    movableTiles,
  };
}
