import { calculateDamage } from "./damage.js";
import { chebyshevDistance } from "./grid.js";
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

/** §23: Bonus, wenn der Angriff das Ziel sicher besiegt. */
const LETHAL_BONUS = 100;
/** §23: Bonus, wenn das Ziel vor dem Angriff weniger als 50 % MaxHP hat. */
const WOUNDED_BONUS = 40;
/** §23: Schwelle für WOUNDED_BONUS als Anteil von MaxHP. */
const WOUNDED_HP_RATIO = 0.5;
/** §23: Bonus, wenn das Ziel ein Healer ist. */
const HEALER_BONUS = 30;
/** §20.4: Vorlage des Healers. */
const HEALER_TEMPLATE_ID = "healer";
/** §23: Bonus, wenn die Distanz beim Angriff grösser als RANGED_DISTANCE ist. */
const RANGED_BONUS = 10;
/** §23: Distanz, ab der (exklusiv) RANGED_BONUS gilt. */
const RANGED_DISTANCE = 1;

/**
 * Score einer Angriffsoption nach §23: Grundscore 0, +100 bei sicherem
 * Besiegen, +40 bei weniger als 50 % MaxHP vor dem Angriff, +30 gegen einen
 * Healer, +10 bei Chebyshev-Distanz grösser als 1 nach der Bewegung und
 * +min(Schaden, verbleibende HP des Ziels). Ändert keinen Spielzustand.
 *
 * @param {import("./game-state.js").GameState} state
 * @param {number} unitId
 * @param {AttackOption} option
 * @returns {number}
 */
export function scoreAttackOption(state, unitId, option) {
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(
      `scoreAttackOption: Unit-ID ${unitId} ist nicht im Spielzustand`,
    );
  }
  const target = state.units.find(({ id }) => id === option.targetId);
  if (!target) {
    throw new Error(
      `scoreAttackOption: Unit-ID ${option.targetId} ist nicht im Spielzustand`,
    );
  }
  const template = loadUnitTemplates().find(({ id }) => id === unit.templateId);
  if (!template) {
    throw new Error(`scoreAttackOption: Vorlage ${unit.templateId} fehlt`);
  }

  const damage = calculateDamage(
    unit.stats,
    target.stats,
    template.basicAttack,
  );
  let score = 0;
  if (damage >= target.hp) {
    score += LETHAL_BONUS;
  }
  if (target.hp < target.maxHp * WOUNDED_HP_RATIO) {
    score += WOUNDED_BONUS;
  }
  if (target.templateId === HEALER_TEMPLATE_ID) {
    score += HEALER_BONUS;
  }
  if (chebyshevDistance(option.position, target.position) > RANGED_DISTANCE) {
    score += RANGED_BONUS;
  }
  score += Math.min(damage, target.hp);
  return score;
}

/**
 * @typedef {AttackOption & {
 *   score: number,
 *   totalDamage: number,
 *   targetTile?: import("./grid.js").Position,
 * }} ScoredAttackOption
 * Angriffsoption mit Score (§23) und Gesamtschaden (§23.1). `targetTile` ist
 * das ausgewählte Zielfeld bei Tile-Targeting.
 */

/**
 * Wählt die Angriffsoption mit dem höchsten Score (§23). Gleichstand nach
 * §23.1: höherer Gesamtschaden, geringere Bewegungskosten, niedrigere Unit-ID
 * des primären Ziels, niedrigere Tile-ID des Zielfelds bei Tile-Targeting,
 * niedrigere Tile-ID des Standfelds. Ohne Zufall.
 *
 * @param {import("./grid.js").GameMap} map
 * @param {readonly ScoredAttackOption[]} options
 * @returns {ScoredAttackOption}
 */
export function chooseAttackOption(map, options) {
  void map;
  void options;
  throw new Error("not implemented");
}
