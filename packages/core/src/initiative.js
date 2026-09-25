/**
 * @typedef {object} Round
 * @property {number[]} order Unit-IDs in der zu Rundenbeginn festgelegten Zugreihenfolge (§5).
 * @property {number} next Index der nächsten noch nicht geprüften Position in `order`.
 */

/**
 * @typedef {object} Activation
 * @property {number | null} unitId Unit-ID der aktivierten Einheit, `null`, wenn die Runde vorbei ist.
 * @property {Round} round
 */

/**
 * Legt zu Beginn einer Runde die Initiative aller lebenden Einheiten fest
 * (§5, §5.1).
 *
 * @param {import("./game-state.js").GameState} state
 * @returns {Round}
 */
export function startRound(state) {
  // §5: höhere SPD zuerst; §5.1: bei Gleichstand niedrigere Unit-ID zuerst.
  const order = [...state.units]
    .sort((a, b) => b.stats.spd - a.stats.spd || a.id - b.id)
    .map(({ id }) => id);

  return { order, next: 0 };
}

/**
 * Liefert die nächste Aktivierung der Runde. Einheiten, die nicht mehr im
 * Spielzustand sind, werden übersprungen (§18).
 *
 * @param {import("./game-state.js").GameState} state
 * @param {Round} round
 * @returns {Activation}
 */
export function nextActivation(state, round) {
  const alive = new Set(state.units.map(({ id }) => id));

  for (let index = round.next; index < round.order.length; index += 1) {
    const unitId = round.order[index];
    // §18: Der ausstehende Zug einer besiegten Einheit entfällt.
    if (unitId !== undefined && alive.has(unitId)) {
      return { unitId, round: { order: round.order, next: index + 1 } };
    }
  }

  return {
    unitId: null,
    round: { order: round.order, next: round.order.length },
  };
}
