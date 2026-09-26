import {
  applyTurnInput,
  beginActivation,
  createGreyboxLevel,
  endActivation,
  isValidTarget,
  loadUnitTemplates,
  planAiActivation,
  previewAction,
  reachableTiles,
  resolveAction,
  startCombat,
} from "@tactics/core";

/**
 * @typedef {object} PlayerControl
 * @property {import("../../core/src/combat-flow.js").Combat} combat Laufender Kampf (§5, §24).
 * @property {import("../../core/src/turn-phases.js").ActivationPhase | null} activation Aktivierung der aktiven Spielerfigur (§6), `null`, wenn keine Einheit aktiv ist.
 * @property {number | null} targetId Gewähltes Ziel der Basic Attack, dessen Forecast auf Bestätigung wartet (§22), sonst `null`.
 * @property {import("../../core/src/grid.js").Position | null} from Standfeld der aktiven Spielerfigur zu Beginn ihrer Aktivierung, `null` ohne aktive Spielerfigur.
 * @property {LogEntry[]} log Eine Zeile pro beendeter Aktivierung beider Teams.
 * @property {number} recentStart Index des ersten Log-Eintrags der zuletzt gezogenen Einheiten.
 */

/**
 * @typedef {{ type: "BASIC_ATTACK", targetId: number, damage: number }
 *   | { type: "WAIT" }} LoggedAction
 */

/**
 * @typedef {object} LogEntry
 * @property {number} round Runde der Aktivierung (§5).
 * @property {number} unitId Unit-ID der aktivierten Einheit.
 * @property {import("../../core/src/grid.js").Position} from Standfeld vor der Bewegung.
 * @property {import("../../core/src/grid.js").Position} to Standfeld nach der Bewegung, gleich `from` ohne Bewegung.
 * @property {LoggedAction} action
 * @property {number | null} targetHp HP des Ziels nach der Aktion, `null` bei WAIT. 0 oder weniger heisst besiegt (§18).
 */

/**
 * @typedef {"SIEG" | "NIEDERLAGE"} CombatResult
 */

/**
 * @typedef {{ type: "CLICK_TILE", position: import("../../core/src/grid.js").Position }
 *   | { type: "WAIT" }
 *   | { type: "CONFIRM" }
 *   | { type: "CANCEL" }
 *   | { type: "RESTART" }} ControlInput
 */

/**
 * @typedef {object} ControlView
 * @property {number} round Rundennummer (§5).
 * @property {number[]} initiativeOrder Zugreihenfolge der laufenden Runde (§5, §5.1).
 * @property {number | null} activeUnitId Unit-ID der aktiven Spielerfigur.
 * @property {import("../../core/src/grid.js").Position[]} movableTiles Zur Bewegung markierte Felder (§4, §6).
 * @property {CombatResult | null} result Ergebnis nach §24, `null`, solange der Kampf läuft.
 * @property {number[]} recentUnitIds Einheiten, die zuletzt gezogen haben.
 */

/** Anzeige des Ergebnisses zum Kampfstatus nach §24. */
const RESULT_BY_STATUS = Object.freeze({
  victory: /** @type {CombatResult} */ ("SIEG"),
  defeat: /** @type {CombatResult} */ ("NIEDERLAGE"),
});

/**
 * @typedef {object} AttackView
 * @property {number[]} targetIds Als Ziel der Basic Attack markierte Einheiten (§8, §9).
 * @property {import("../../core/src/preview-action.js").Forecast | null} forecast Forecast des gewählten Ziels (§22), `null`, wenn keiner angezeigt wird.
 */

/**
 * Startet den Kampf und spielt gegnerische Aktivierungen nach der KI (§23),
 * bis eine Spielerfigur aktiv ist oder der Kampf entschieden ist (§24).
 *
 * @param {import("../../core/src/game-state.js").GameState} state
 * @returns {PlayerControl}
 */
export function startPlayerControl(state) {
  return playEnemyActivations(startCombat(state), [], 0);
}

/**
 * @param {import("../../core/src/game-state.js").GameState} state
 * @param {number} unitId
 */
function positionOf(state, unitId) {
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(`Unit-ID ${unitId} ist nicht im Spielzustand`);
  }
  return { ...unit.position };
}

/**
 * Spielt gegnerische Aktivierungen nach dem Plan aus `planAiActivation`
 * (§23, §23.2), bis eine Spielerfigur aktiv ist oder der Kampf entschieden
 * ist (§24). Jede Aktivierung kommt ins Log.
 *
 * @param {import("../../core/src/combat-flow.js").Combat} combat
 * @param {LogEntry[]} log
 * @param {number} recentStart
 * @returns {PlayerControl}
 */
function playEnemyActivations(combat, log, recentStart) {
  let current = combat;
  const entries = [...log];
  while (current.activeUnitId !== null) {
    const activeId = current.activeUnitId;
    const unit = current.state.units.find(({ id }) => id === activeId);
    if (unit?.team === "player") {
      return {
        combat: current,
        activation: beginActivation(activeId),
        targetId: null,
        from: { ...unit.position },
        log: entries,
        recentStart,
      };
    }
    const played = playAiActivation(current.state, activeId, current.round);
    entries.push(played.entry);
    current = endActivation(current, played.state);
  }
  return {
    combat: current,
    activation: null,
    targetId: null,
    from: null,
    log: entries,
    recentStart,
  };
}

/**
 * Eine Aktivierung nach der KI: Eingaben mit `applyTurnInput`, Aktion mit
 * `resolveAction` (§6, §18, §23).
 *
 * @param {import("../../core/src/game-state.js").GameState} start
 * @param {number} unitId
 * @param {number} round
 * @returns {{ state: import("../../core/src/game-state.js").GameState, entry: LogEntry }}
 */
function playAiActivation(start, unitId, round) {
  const from = positionOf(start, unitId);
  const plan = planAiActivation(start, unitId);
  let state = start;
  let activation = beginActivation(unitId);
  for (const input of plan.inputs) {
    const result = applyTurnInput(state, activation, input);
    if (!result.accepted) {
      throw new Error(
        `KI-Eingabe ${input.type} von Unit-ID ${unitId} abgelehnt`,
      );
    }
    state = result.state;
    activation = result.activation;
  }
  const to = positionOf(state, unitId);

  if (!plan.action) {
    // §23.2: optional MOVE, danach WAIT.
    return {
      state,
      entry: {
        round,
        unitId,
        from,
        to,
        action: { type: "WAIT" },
        targetHp: null,
      },
    };
  }

  const resolved = resolveAction(state, plan.action);
  const { damage, targetHp } = resolved;
  if (!resolved.accepted || damage === undefined || targetHp === undefined) {
    throw new Error(`KI-Angriff von Unit-ID ${unitId} abgelehnt`);
  }
  const { targetId } = plan.action;
  return {
    state: resolved.state,
    entry: {
      round,
      unitId,
      from,
      to,
      action: { type: "BASIC_ATTACK", targetId, damage },
      targetHp,
    },
  };
}

/**
 * Wendet eine Eingabe des Menschen an. Der übergebene Zustand bleibt
 * unverändert.
 *
 * @param {PlayerControl} control
 * @param {ControlInput} input
 * @returns {PlayerControl}
 */
export function applyControlInput(control, input) {
  if (input.type === "RESTART") {
    // Neu starten baut das Greybox-Level neu auf (§25).
    return startPlayerControl(createGreyboxLevel());
  }

  // §24: Ist der Kampf entschieden, gibt es keine aktive Einheit mehr.
  const { combat, activation, targetId } = control;
  if (activation === null || activation.ended) {
    return control;
  }

  // §22: Solange der Forecast offen ist, gelten nur Bestätigen und Abbrechen.
  if (targetId !== null) {
    if (input.type === "CANCEL") {
      return { ...control, targetId: null };
    }
    if (input.type === "CONFIRM") {
      return confirmAttack(control, activation, targetId) ?? control;
    }
    return control;
  }

  if (input.type === "CONFIRM" || input.type === "CANCEL") {
    return control;
  }

  if (input.type === "CLICK_TILE") {
    // §9: Ein Klick auf ein gültiges Ziel öffnet den Forecast (§22).
    const clicked = combat.state.units.find(
      ({ position }) =>
        position.x === input.position.x && position.y === input.position.y,
    );
    if (clicked && attackTargetIds(control).includes(clicked.id)) {
      return { ...control, targetId: clicked.id };
    }
  }

  /** @type {import("../../core/src/turn-phases.js").TurnInput} */
  const turnInput =
    input.type === "CLICK_TILE"
      ? { type: "MOVE", to: input.position }
      : { type: "WAIT" };
  const result = applyTurnInput(combat.state, activation, turnInput);
  if (!result.accepted) {
    return control;
  }

  // §6: Nach WAIT endet die Aktivierung, die nächste Einheit ist dran (§5).
  if (result.activation.ended) {
    const entry = {
      round: combat.round,
      unitId: activation.unitId,
      from: control.from ?? positionOf(combat.state, activation.unitId),
      to: positionOf(result.state, activation.unitId),
      action: /** @type {LoggedAction} */ ({ type: "WAIT" }),
      targetHp: null,
    };
    return playEnemyActivations(
      endActivation(combat, result.state),
      [...control.log, entry],
      control.log.length,
    );
  }
  return {
    ...control,
    combat: { ...combat, state: result.state },
    activation: result.activation,
    targetId: null,
  };
}

/**
 * Führt die bestätigte Basic Attack aus: ACTION verbraucht die Action und
 * beendet die Aktivierung (§6), `resolveAction` wendet den Schaden an und
 * entfernt besiegte Einheiten (§18). `null`, wenn die Aktion abgelehnt wird.
 *
 * @param {PlayerControl} control
 * @param {import("../../core/src/turn-phases.js").ActivationPhase} activation
 * @param {number} targetId
 * @returns {PlayerControl | null}
 */
function confirmAttack(control, activation, targetId) {
  const { combat } = control;
  const turn = applyTurnInput(combat.state, activation, { type: "ACTION" });
  if (!turn.accepted) {
    return null;
  }
  const resolved = resolveAction(turn.state, {
    type: "BASIC_ATTACK",
    attackerId: activation.unitId,
    targetId,
  });
  const { damage, targetHp } = resolved;
  if (!resolved.accepted || damage === undefined || targetHp === undefined) {
    return null;
  }
  /** @type {LogEntry} */
  const entry = {
    round: combat.round,
    unitId: activation.unitId,
    from: control.from ?? positionOf(combat.state, activation.unitId),
    to: positionOf(turn.state, activation.unitId),
    action: { type: "BASIC_ATTACK", targetId, damage },
    targetHp,
  };
  return playEnemyActivations(
    endActivation(combat, resolved.state),
    [...control.log, entry],
    control.log.length,
  );
}

/**
 * Gültige Ziele der Basic Attack der aktiven Spielerfigur von ihrem
 * aktuellen Feld aus (§8, §9). Leer, wenn keine Action mehr offen ist (§6).
 *
 * @param {PlayerControl} control
 * @returns {number[]}
 */
function attackTargetIds(control) {
  const { combat, activation } = control;
  if (activation === null || activation.ended) {
    return [];
  }
  const attacker = combat.state.units.find(
    ({ id }) => id === activation.unitId,
  );
  const template = loadUnitTemplates().find(
    ({ id }) => id === attacker?.templateId,
  );
  if (!attacker || !template) {
    return [];
  }
  return combat.state.units
    .filter(({ id }) =>
      isValidTarget(combat.state, attacker.id, template.basicAttack, id),
    )
    .map(({ id }) => id);
}

/**
 * Anzeigedaten der Steuerung: Runde, Initiative, aktive Einheit, markierte
 * Felder.
 *
 * @param {PlayerControl} control
 * @returns {ControlView}
 */
export function createControlView(control) {
  const { combat, activation } = control;
  // §6: genau einmal Movement pro Aktivierung.
  const movableTiles =
    activation === null || activation.moved || activation.ended
      ? []
      : reachableTiles(combat.state, activation.unitId).map(
          ({ position }) => position,
        );

  return {
    round: combat.round,
    initiativeOrder: [...combat.initiative.order],
    activeUnitId: activation === null ? null : activation.unitId,
    movableTiles,
    result:
      combat.status === "ongoing" ? null : RESULT_BY_STATUS[combat.status],
    recentUnitIds: control.log
      .slice(control.recentStart)
      .map(({ unitId }) => unitId),
  };
}

/**
 * Anzeigedaten des Angriffs: markierte Ziele und Forecast (§9, §22).
 *
 * @param {PlayerControl} control
 * @returns {AttackView}
 */
export function createAttackView(control) {
  const { activation, targetId } = control;
  // §22: Der Forecast verändert den Spielzustand nie.
  const forecast =
    activation === null || targetId === null
      ? null
      : previewAction(control.combat.state, {
          type: "BASIC_ATTACK",
          attackerId: activation.unitId,
          targetId,
        });
  return { targetIds: attackTargetIds(control), forecast };
}
