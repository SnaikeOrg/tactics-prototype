import { isDefeated } from "./game-state.js";
import { planBasicAttack } from "./resolve-action.js";

/** §22: Ziel-HP werden im Forecast nicht negativ angezeigt („8 → 0“). */
const MIN_DISPLAYED_HP = 0;

/**
 * @typedef {object} Forecast
 * @property {number} targetId Unit-ID des Ziels.
 * @property {number} targetHpBefore HP des Ziels vor dem Treffer.
 * @property {number} targetHpAfter HP des Ziels nach dem Treffer, nie unter 0
 *   (§22).
 * @property {number} damage Schaden des Treffers (§12, §13).
 * @property {boolean} lethal Treffer ist tödlich, LETHAL (§18, §22).
 */

/**
 * Liefert den Combat Forecast einer Aktion, ohne den Spielzustand zu
 * verändern (§22). Nutzt dieselbe Berechnung wie `resolveAction()`. Bei
 * ungültigem Ziel (§9) gibt es kein Ergebnis.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {import("./resolve-action.js").Action} action
 * @returns {Forecast | null}
 */
export function previewAction(state, action) {
  const hit = planBasicAttack(state, action);
  if (!hit) {
    return null;
  }
  const { target, damage } = hit;
  const hp = target.hp - damage;

  return {
    targetId: target.id,
    targetHpBefore: target.hp,
    targetHpAfter: Math.max(MIN_DISPLAYED_HP, hp),
    damage,
    lethal: isDefeated(hp),
  };
}
