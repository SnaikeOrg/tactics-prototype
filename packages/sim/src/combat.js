import {
  applyTurnInput,
  approachNearestEnemy,
  attackOptions,
  beginActivation,
  calculateDamage,
  chooseAttackOption,
  combatStatus,
  createGreyboxLevel,
  loadUnitTemplates,
  nextActivation,
  resolveAction,
  scoreAttackOption,
  startRound,
} from "@tactics/core";

/**
 * @typedef {"SIEG" | "NIEDERLAGE" | "ABBRUCH"} CombatResult
 */

/**
 * @typedef {{ type: "BASIC_ATTACK", targetId: number, damage: number }
 *   | { type: "WAIT" }} LoggedAction
 */

/**
 * @typedef {object} LogEntry
 * @property {number} round Runde der Aktivierung, ab 1.
 * @property {number} unitId Unit-ID der aktivierten Einheit.
 * @property {import("../../core/src/grid.js").Position} from Standfeld vor der Bewegung.
 * @property {import("../../core/src/grid.js").Position} to Standfeld nach der Bewegung, gleich `from` ohne Bewegung.
 * @property {LoggedAction} action
 * @property {number | null} targetHp HP des Ziels nach der Aktion, `null` bei WAIT. 0 oder weniger heisst besiegt (§18).
 */

/**
 * @typedef {object} CombatRun
 * @property {CombatResult} result
 * @property {number} rounds Anzahl gespielter Runden.
 * @property {LogEntry[]} log Eine Zeile pro Aktivierung.
 * @property {import("../../core/src/game-state.js").GameState} state Endzustand.
 */

/** Ergebnis nach §24 zum Kampfstatus aus `combatStatus`. */
const RESULT_BY_STATUS = Object.freeze({
  victory: /** @type {CombatResult} */ ("SIEG"),
  defeat: /** @type {CombatResult} */ ("NIEDERLAGE"),
});

/** Ergebnis, wenn das Rundenlimit erreicht ist (docs/DECISIONS.md). */
const ABORT_RESULT = /** @type {CombatResult} */ ("ABBRUCH");

/**
 * @typedef {import("../../core/src/game-state.js").GameState} GameState
 * @typedef {import("../../core/src/turn-phases.js").ActivationPhase} ActivationPhase
 * @typedef {import("../../core/src/turn-phases.js").TurnInput} TurnInput
 */

/**
 * Wirft, wenn `applyTurnInput` oder `resolveAction` eine Eingabe abgelehnt hat.
 *
 * @template {{ accepted: boolean }} T
 * @param {T} result
 * @param {string} context
 * @returns {T}
 */
export function requireAccepted(result, context) {
  if (!result.accepted) {
    throw new Error(`runCombat: Eingabe abgelehnt: ${context}`);
  }
  return result;
}

/**
 * @param {GameState} state
 * @param {number} unitId
 */
function unitIn(state, unitId) {
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(`runCombat: Unit-ID ${unitId} ist nicht im Spielzustand`);
  }
  return unit;
}

/**
 * Schaden einer Basic Attack, wie `resolveAction` ihn anwendet (§12, §13).
 *
 * @param {GameState} state
 * @param {number} attackerId
 * @param {number} targetId
 * @returns {number}
 */
function basicAttackDamage(state, attackerId, targetId) {
  const attacker = unitIn(state, attackerId);
  const template = loadUnitTemplates().find(
    ({ id }) => id === attacker.templateId,
  );
  if (!template) {
    throw new Error(`runCombat: Vorlage ${attacker.templateId} fehlt`);
  }
  return calculateDamage(
    attacker.stats,
    unitIn(state, targetId).stats,
    template.basicAttack,
  );
}

/**
 * @param {GameState} state
 * @param {ActivationPhase} phase
 * @param {TurnInput} input
 * @returns {{ state: GameState, phase: ActivationPhase }}
 */
function applyInput(state, phase, input) {
  const result = requireAccepted(
    applyTurnInput(state, phase, input),
    `${input.type} von Unit-ID ${phase.unitId}`,
  );
  return { state: result.state, phase: result.activation };
}

/**
 * Eine Aktivierung nach der KI aus §23: beste Angriffsoption mit Bewegung und
 * Basic Attack, sonst Annäherung oder WAIT nach §23.2.
 *
 * @param {GameState} start
 * @param {number} unitId
 * @param {number} round
 * @returns {{ state: GameState, entry: LogEntry }}
 */
function playActivation(start, unitId, round) {
  const from = { ...unitIn(start, unitId).position };
  let state = start;
  let phase = beginActivation(unitId);

  const options = attackOptions(state, unitId);
  if (options.length === 0) {
    // §23.2: optional MOVE, danach WAIT.
    for (const input of approachNearestEnemy(state, unitId).inputs) {
      ({ state, phase } = applyInput(state, phase, input));
    }
    return {
      state,
      entry: {
        round,
        unitId,
        from,
        to: { ...unitIn(state, unitId).position },
        action: { type: "WAIT" },
        targetHp: null,
      },
    };
  }

  // §23, §23.1: Score und Gesamtschaden je Option, dann beste Option.
  const chosen = chooseAttackOption(
    state.map,
    options.map((option) => ({
      ...option,
      score: scoreAttackOption(state, unitId, option),
      totalDamage: Math.min(
        basicAttackDamage(state, unitId, option.targetId),
        unitIn(state, option.targetId).hp,
      ),
    })),
  );

  if (chosen.position.x !== from.x || chosen.position.y !== from.y) {
    ({ state, phase } = applyInput(state, phase, {
      type: "MOVE",
      to: chosen.position,
    }));
  }
  // §6: ACTION beendet die Aktivierung, aufgelöst wird sie mit resolveAction.
  ({ state } = applyInput(state, phase, { type: "ACTION" }));

  const targetId = chosen.targetId;
  const hpBefore = unitIn(state, targetId).hp;
  const damage = basicAttackDamage(state, unitId, targetId);
  state = requireAccepted(
    resolveAction(state, {
      type: "BASIC_ATTACK",
      attackerId: unitId,
      targetId,
    }),
    `BASIC_ATTACK von Unit-ID ${unitId} auf Unit-ID ${targetId}`,
  ).state;

  return {
    state,
    entry: {
      round,
      unitId,
      from,
      to: { ...unitIn(state, unitId).position },
      action: { type: "BASIC_ATTACK", targetId, damage },
      targetHp: hpBefore - damage,
    },
  };
}

/**
 * Spielt den Greybox-Level (§25) KI gegen KI durch (§5, §6, §23, §24). Jede
 * Einheit beider Teams handelt nach der KI aus §23. Der Kampf endet, sobald
 * §24 Sieg oder Niederlage meldet, oder nach `roundLimit` Runden mit
 * `ABBRUCH`. Ohne Zufall.
 *
 * @param {{ roundLimit: number }} options
 * @returns {CombatRun}
 */
export function runCombat({ roundLimit }) {
  if (!Number.isInteger(roundLimit) || roundLimit < 1) {
    throw new RangeError("runCombat: roundLimit muss eine Ganzzahl ab 1 sein");
  }

  let state = createGreyboxLevel();
  /** @type {LogEntry[]} */
  const log = [];
  let rounds = 0;

  while (rounds < roundLimit && combatStatus(state) === "ongoing") {
    rounds += 1;
    // §5: Initiative zu Rundenbeginn, danach fix.
    let order = startRound(state);
    for (;;) {
      const activation = nextActivation(state, order);
      order = activation.round;
      if (activation.unitId === null) {
        break;
      }
      const played = playActivation(state, activation.unitId, rounds);
      state = played.state;
      log.push(played.entry);
      // §24: Der Kampf endet, sobald Sieg oder Niederlage feststeht.
      if (combatStatus(state) !== "ongoing") {
        break;
      }
    }
  }

  const status = combatStatus(state);
  const result = status === "ongoing" ? ABORT_RESULT : RESULT_BY_STATUS[status];
  return { result, rounds, log, state };
}
