import { reachableTiles } from "./movement.js";
import { isValidTarget } from "./targeting.js";
import { loadUnitTemplates } from "./unit.js";

/**
 * @typedef {object} AttackOption
 * @property {import("./grid.js").Position} position Standfeld der Angriffsoption.
 * @property {number} cost Bewegungskosten bis zum Standfeld, 0 ohne Bewegung (§4).
 * @property {number} targetId Unit-ID des Ziels der Basic Attack.
 */

/**
 * Alle Angriffsoptionen einer Einheit zu Beginn ihres Zugs (§23): jede legale
 * Kombination aus Bewegung (auch keine Bewegung) und Basic Attack, die eine
 * gegnerische Einheit trifft. WAIT und reine Bewegung sind keine
 * Angriffsoptionen. Reihenfolge: Standfelder wie `reachableTiles`, das eigene
 * Feld zuerst, je Standfeld Ziele nach Unit-ID.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @returns {AttackOption[]}
 */
export function attackOptions(state, unitId) {
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(
      `attackOptions: Unit-ID ${unitId} ist nicht im Spielzustand`,
    );
  }
  const template = loadUnitTemplates().find(({ id }) => id === unit.templateId);
  if (!template) {
    throw new Error(`attackOptions: Vorlage ${unit.templateId} fehlt`);
  }

  const standTiles = [
    { position: unit.position, cost: 0 },
    ...reachableTiles(state, unitId),
  ];
  const targetIds = state.units
    .filter(({ team }) => team !== unit.team)
    .map(({ id }) => id)
    .sort((a, b) => a - b);

  /** @type {AttackOption[]} */
  const options = [];
  for (const { position, cost } of standTiles) {
    const moved = {
      map: state.map,
      units: state.units.map((other) =>
        other.id === unitId ? { ...other, position } : other,
      ),
    };
    for (const targetId of targetIds) {
      if (isValidTarget(moved, unitId, template.basicAttack, targetId)) {
        options.push({
          position: { x: position.x, y: position.y },
          cost,
          targetId,
        });
      }
    }
  }
  return options;
}
