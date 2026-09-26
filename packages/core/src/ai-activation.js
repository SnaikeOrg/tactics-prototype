import { approachNearestEnemy } from "./ai-approach.js";
import {
  attackOptions,
  chooseAttackOption,
  scoreAttackOption,
  totalDamage,
} from "./ai-options.js";

/**
 * @typedef {object} AiActivationPlan
 * @property {import("./turn-phases.js").TurnInput[]} inputs Eingaben der
 *   Aktivierung für `applyTurnInput`: optional MOVE, danach ACTION oder WAIT
 *   (§6).
 * @property {import("./resolve-action.js").Action | null} action Aktion für
 *   `resolveAction` nach ACTION, `null` bei WAIT.
 */

/**
 * Plant die Aktivierung einer Einheit nach der KI aus §23, ohne den
 * Spielzustand zu verändern. Mit Angriffsoption: die nach §23 und §23.1
 * gewählte Option, also MOVE auf ihr Standfeld (entfällt auf dem aktuellen
 * Feld), dann ACTION und BASIC_ATTACK auf ihr Ziel. Sonst die Eingaben der
 * Annäherung nach §23.2, ohne Aktion. Ohne Zufall.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {AiActivationPlan}
 */
export function planAiActivation(state, unitId) {
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(
      `planAiActivation: Unit-ID ${unitId} ist nicht im Spielzustand`,
    );
  }

  const options = attackOptions(state, unitId);
  if (options.length === 0) {
    // §23.2: optional MOVE, danach WAIT.
    return { inputs: approachNearestEnemy(state, unitId).inputs, action: null };
  }

  // §23, §23.1: Score und Gesamtschaden je Option, dann beste Option.
  const chosen = chooseAttackOption(
    state.map,
    options.map((option) => ({
      ...option,
      score: scoreAttackOption(state, unitId, option),
      totalDamage: totalDamage(state, unitId, option),
    })),
  );

  /** @type {import("./turn-phases.js").TurnInput[]} */
  const inputs = [];
  if (
    chosen.position.x !== unit.position.x ||
    chosen.position.y !== unit.position.y
  ) {
    inputs.push({
      type: "MOVE",
      to: { x: chosen.position.x, y: chosen.position.y },
    });
  }
  // §6: ACTION beendet die Aktivierung, aufgelöst wird sie mit resolveAction.
  inputs.push({ type: "ACTION" });
  return {
    inputs,
    action: {
      type: "BASIC_ATTACK",
      attackerId: unitId,
      targetId: chosen.targetId,
    },
  };
}
