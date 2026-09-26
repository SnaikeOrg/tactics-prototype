import {
  applyTurnInput,
  beginActivation,
  endActivation,
  isValidTarget,
  loadUnitTemplates,
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
 */

/**
 * @typedef {{ type: "CLICK_TILE", position: import("../../core/src/grid.js").Position }
 *   | { type: "WAIT" }
 *   | { type: "CONFIRM" }
 *   | { type: "CANCEL" }} ControlInput
 */

/**
 * @typedef {object} ControlView
 * @property {number} round Rundennummer (§5).
 * @property {number[]} initiativeOrder Zugreihenfolge der laufenden Runde (§5, §5.1).
 * @property {number | null} activeUnitId Unit-ID der aktiven Spielerfigur.
 * @property {import("../../core/src/grid.js").Position[]} movableTiles Zur Bewegung markierte Felder (§4, §6).
 */

/**
 * @typedef {object} AttackView
 * @property {number[]} targetIds Als Ziel der Basic Attack markierte Einheiten (§8, §9).
 * @property {import("../../core/src/preview-action.js").Forecast | null} forecast Forecast des gewählten Ziels (§22), `null`, wenn keiner angezeigt wird.
 */

/**
 * Startet den Kampf und beendet gegnerische Aktivierungen ohne Eingabe, bis
 * eine Spielerfigur aktiv ist.
 *
 * @param {import("../../core/src/game-state.js").GameState} state
 * @returns {PlayerControl}
 */
export function startPlayerControl(state) {
  return skipEnemyActivations(startCombat(state));
}

/**
 * Übergangslösung bis zu den Gegnerzügen: gegnerische Aktivierungen enden
 * ohne Eingabe, bis eine Spielerfigur aktiv ist oder der Kampf entschieden
 * ist (§24).
 *
 * @param {import("../../core/src/combat-flow.js").Combat} combat
 * @returns {PlayerControl}
 */
function skipEnemyActivations(combat) {
  let current = combat;
  while (current.activeUnitId !== null) {
    const activeId = current.activeUnitId;
    const unit = current.state.units.find(({ id }) => id === activeId);
    if (unit?.team === "player") {
      return {
        combat: current,
        activation: beginActivation(activeId),
        targetId: null,
      };
    }
    current = endActivation(current, current.state);
  }
  return { combat: current, activation: null, targetId: null };
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
      return confirmAttack(combat, activation, targetId) ?? control;
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
    return skipEnemyActivations(endActivation(combat, result.state));
  }
  return {
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
 * @param {import("../../core/src/combat-flow.js").Combat} combat
 * @param {import("../../core/src/turn-phases.js").ActivationPhase} activation
 * @param {number} targetId
 * @returns {PlayerControl | null}
 */
function confirmAttack(combat, activation, targetId) {
  const turn = applyTurnInput(combat.state, activation, { type: "ACTION" });
  if (!turn.accepted) {
    return null;
  }
  const resolved = resolveAction(turn.state, {
    type: "BASIC_ATTACK",
    attackerId: activation.unitId,
    targetId,
  });
  if (!resolved.accepted) {
    return null;
  }
  return skipEnemyActivations(endActivation(combat, resolved.state));
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
