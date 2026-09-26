import { calculateDamage } from "./damage.js";
import { applyDamage } from "./game-state.js";
import { isValidTarget } from "./targeting.js";
import { loadUnitTemplates } from "./unit.js";

/**
 * @typedef {{ type: "BASIC_ATTACK", attackerId: number, targetId: number }} Action
 */

/**
 * @typedef {object} ActionResult
 * @property {boolean} accepted
 * @property {import("./game-state.js").GameState} state
 * @property {number} [damage] Angewandter Schaden, nur bei akzeptierter
 *   Aktion (§12, §13).
 * @property {number} [targetHp] HP des Ziels nach dem Schaden, nur bei
 *   akzeptierter Aktion. 0 oder weniger heisst besiegt (§18), auch wenn das
 *   Ziel schon aus dem Spielzustand entfernt ist.
 */

/**
 * Löst eine Aktion auf und verändert den Spielzustand (§15, §22). Ein
 * ungültiges Ziel wird abgelehnt, der Spielzustand bleibt dann unverändert.
 * Der übergebene Spielzustand wird nie verändert.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {Action} action
 * @returns {ActionResult}
 */
export function resolveAction(state, action) {
  if (action.type !== "BASIC_ATTACK") {
    throw new Error(
      `resolveAction: Aktion ${action.type} wird noch nicht unterstützt`,
    );
  }

  const attacker = state.units.find(({ id }) => id === action.attackerId);
  if (!attacker) {
    throw new Error(
      `resolveAction: Unit-ID ${action.attackerId} ist nicht im Spielzustand`,
    );
  }

  const template = loadUnitTemplates().find(
    ({ id }) => id === attacker.templateId,
  );
  if (!template) {
    throw new Error(
      `resolveAction: Vorlage ${attacker.templateId} ist unbekannt`,
    );
  }
  const ability = template.basicAttack;

  // §9, §8: nur ein gültiges ENEMY-Ziel in Reichweite; §10.1 SINGLE.
  if (!isValidTarget(state, attacker.id, ability, action.targetId)) {
    return { accepted: false, state };
  }
  const target = state.units.find(({ id }) => id === action.targetId);
  if (!target) {
    return { accepted: false, state };
  }

  // §15: Schaden berechnen → HP reduzieren → Tod prüfen.
  const damage = calculateDamage(attacker.stats, target.stats, ability);
  const { state: next } = applyDamage(state, target.id, damage);

  // §15: Trigger abhandeln — leer, bis Passives (v2) umgesetzt sind.
  // §15: Kein automatischer Gegenangriff. Die Aktion ist beendet.
  return {
    accepted: true,
    state: next,
    damage,
    targetHp: target.hp - damage,
  };
}
