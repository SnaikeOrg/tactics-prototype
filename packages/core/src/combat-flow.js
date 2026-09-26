import { combatStatus } from "./combat-status.js";
import { nextActivation, startRound } from "./initiative.js";

/**
 * @typedef {object} Combat
 * @property {import("./game-state.js").GameState} state Spielzustand.
 * @property {number} round Aktuelle Runde, ab 1 (§5).
 * @property {number | null} activeUnitId Unit-ID der aktiven Einheit, `null`, sobald Sieg oder Niederlage feststeht (§24).
 * @property {import("./combat-status.js").CombatStatus} status Kampfstatus nach §24.
 * @property {import("./initiative.js").Round} initiative Zugreihenfolge der aktuellen Runde (§5, §5.1).
 */

/** §5: Der Kampf beginnt mit Runde 1. */
const FIRST_ROUND = 1;

/**
 * Bestimmt ab `initiative` die nächste aktive Einheit. Ist die Runde vorbei,
 * beginnt die nächste Runde mit neu berechneter Initiative (§5). Steht Sieg
 * oder Niederlage fest, ist keine Einheit aktiv (§24).
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} round
 * @param {import("./initiative.js").Round} initiative
 * @returns {Combat}
 */
function advance(state, round, initiative) {
  const status = combatStatus(state);
  if (status !== "ongoing") {
    return { state, round, activeUnitId: null, status, initiative };
  }

  // §18: besiegte Einheiten überspringt `nextActivation`.
  const activation = nextActivation(state, initiative);
  if (activation.unitId !== null) {
    return {
      state,
      round,
      activeUnitId: activation.unitId,
      status,
      initiative: activation.round,
    };
  }

  // §5: Initiative zu Beginn jeder Runde neu, danach fix. Solange der Kampf
  // läuft, gibt es lebende Einheiten, die neue Runde hat also eine Aktivierung.
  return advance(state, round + 1, startRound(state));
}

/**
 * Startet einen Kampf: Runde 1, Initiative nach §5 und §5.1, erste aktive
 * Einheit.
 *
 * @param {import("./game-state.js").GameState} state
 * @returns {Combat}
 */
export function startCombat(state) {
  return advance(state, FIRST_ROUND, startRound(state));
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
  if (combat.activeUnitId === null) {
    throw new Error("endActivation: Der Kampf ist bereits entschieden");
  }
  return advance(state, combat.round, combat.initiative);
}
