import {
  applyTurnInput,
  beginActivation,
  createGreyboxLevel,
  endActivation,
  planAiActivation,
  resolveAction,
  startCombat,
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
 * Eine Aktivierung nach der KI aus §23: Plan aus `planAiActivation`, dann
 * die Eingaben mit `applyTurnInput` und die Aktion mit `resolveAction`.
 *
 * @param {GameState} start
 * @param {number} unitId
 * @param {number} round
 * @returns {{ state: GameState, entry: LogEntry }}
 */
function playActivation(start, unitId, round) {
  const from = { ...unitIn(start, unitId).position };
  const plan = planAiActivation(start, unitId);
  let state = start;
  let phase = beginActivation(unitId);

  for (const input of plan.inputs) {
    ({ state, phase } = applyInput(state, phase, input));
  }

  if (!plan.action) {
    // §23.2: optional MOVE, danach WAIT.
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

  const { targetId } = plan.action;
  const context = `BASIC_ATTACK von Unit-ID ${unitId} auf Unit-ID ${targetId}`;
  const resolved = requireAccepted(resolveAction(state, plan.action), context);
  const { damage, targetHp } = resolved;
  if (damage === undefined || targetHp === undefined) {
    throw new Error(`runCombat: ${context} liefert keinen Schaden`);
  }
  state = resolved.state;

  return {
    state,
    entry: {
      round,
      unitId,
      from,
      to: { ...unitIn(state, unitId).position },
      action: { type: "BASIC_ATTACK", targetId, damage },
      targetHp,
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

  // §5, §18, §24: Runden, Initiative und Kampfende führt `core`.
  let combat = startCombat(createGreyboxLevel());
  /** @type {LogEntry[]} */
  const log = [];

  while (combat.activeUnitId !== null && combat.round <= roundLimit) {
    const played = playActivation(
      combat.state,
      combat.activeUnitId,
      combat.round,
    );
    log.push(played.entry);
    combat = endActivation(combat, played.state);
  }

  const { state, status } = combat;
  // Beim Abbruch steht `combat` schon am Anfang der Runde nach dem Limit.
  const rounds = status === "ongoing" ? roundLimit : combat.round;
  const result = status === "ongoing" ? ABORT_RESULT : RESULT_BY_STATUS[status];
  return { result, rounds, log, state };
}
