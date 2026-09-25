import { reachableTiles } from "./movement.js";

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
  return { unitId, moved: false, ended: false };
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
  /** @type {TurnInputResult} */
  const rejected = { accepted: false, state, activation };

  // §6: Nach einer Aktion oder WAIT endet die Aktivierung.
  if (activation.ended) {
    return rejected;
  }

  if (input.type === "MOVE") {
    // §6: genau einmal Movement; ACTION → MOVE ist ausgeschlossen, weil die
    // Aktivierung nach ACTION bereits beendet ist.
    if (activation.moved) {
      return rejected;
    }
    // §4: nur Felder, die mit MOV erreichbar sind.
    const reachable = reachableTiles(state, activation.unitId).some(
      ({ position }) => position.x === input.to.x && position.y === input.to.y,
    );
    if (!reachable) {
      return rejected;
    }
    const to = { x: input.to.x, y: input.to.y };
    const units = state.units.map((unit) =>
      unit.id === activation.unitId ? { ...unit, position: to } : unit,
    );
    return {
      accepted: true,
      state: { map: state.map, units },
      activation: { ...activation, moved: true },
    };
  }

  // §6: ACTION und WAIT verbrauchen die Action und beenden die Aktivierung.
  // Das Auflösen der Aktion selbst ist nicht Teil dieser Funktion.
  return {
    accepted: true,
    state,
    activation: { ...activation, ended: true },
  };
}
