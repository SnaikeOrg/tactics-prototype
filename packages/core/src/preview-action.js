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
 * verändern (§22). Bei ungültigem Ziel (§9) gibt es kein Ergebnis.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {import("./resolve-action.js").Action} action
 * @returns {Forecast | null}
 */
export function previewAction(state, action) {
  void state;
  void action;
  throw new Error("not implemented");
}
