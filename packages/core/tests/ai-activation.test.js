import { describe, expect, it } from "vitest";
import {
  applyTurnInput,
  approachNearestEnemy,
  attackOptions,
  beginActivation,
  chooseAttackOption,
  combatStatus,
  createGameState,
  createGreyboxLevel,
  createMap,
  createUnit,
  loadUnitTemplates,
  nextActivation,
  planAiActivation,
  resolveAction,
  scoreAttackOption,
  startRound,
  totalDamage,
} from "../src/index.js";

/** Rundenlimit des nachgespielten Kampfs, keine Balancing-Zahl. */
const ROUND_LIMIT = 50;

/**
 * @typedef {import("../src/game-state.js").GameState} GameState
 * @typedef {import("../src/ai-activation.js").AiActivationPlan} AiActivationPlan
 */

/**
 * @param {string} id
 * @returns {ReturnType<typeof loadUnitTemplates>[number]}
 */
function template(id) {
  const found = loadUnitTemplates().find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`Vorlage ${id} fehlt`);
  }
  return found;
}

/**
 * Erwarteter Plan aus den bestehenden Bausteinen (§23, §23.1, §23.2).
 *
 * @param {GameState} state
 * @param {number} unitId
 * @returns {AiActivationPlan}
 */
function expectedPlan(state, unitId) {
  const options = attackOptions(state, unitId);
  if (options.length === 0) {
    return { inputs: approachNearestEnemy(state, unitId).inputs, action: null };
  }
  const chosen = chooseAttackOption(
    state.map,
    options.map((option) => ({
      ...option,
      score: scoreAttackOption(state, unitId, option),
      totalDamage: totalDamage(state, unitId, option),
    })),
  );
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(`Unit-ID ${unitId} fehlt`);
  }
  /** @type {import("../src/turn-phases.js").TurnInput[]} */
  const inputs = [];
  if (
    chosen.position.x !== unit.position.x ||
    chosen.position.y !== unit.position.y
  ) {
    inputs.push({
      type: "MOVE",
      to: { x: chosen.position.x, y: chosen.position.y },
    });
  }
  inputs.push({ type: "ACTION" });
  return {
    inputs,
    action: {
      type: "BASIC_ATTACK",
      attackerId: unitId,
      targetId: chosen.targetId,
    },
  };
}

/**
 * Führt einen Plan mit `applyTurnInput` und `resolveAction` aus.
 *
 * @param {GameState} start
 * @param {number} unitId
 * @param {AiActivationPlan} plan
 * @returns {GameState}
 */
function applyPlan(start, unitId, plan) {
  let state = start;
  let phase = beginActivation(unitId);
  for (const input of plan.inputs) {
    const result = applyTurnInput(state, phase, input);
    if (!result.accepted) {
      throw new Error(`${input.type} von Unit-ID ${unitId} abgelehnt`);
    }
    state = result.state;
    phase = result.activation;
  }
  if (plan.action) {
    const resolved = resolveAction(state, plan.action);
    if (!resolved.accepted) {
      throw new Error(`Aktion von Unit-ID ${unitId} abgelehnt`);
    }
    state = resolved.state;
  }
  return state;
}

describe("planAiActivation", () => {
  it("Im Startzustand des Greybox-Levels plant Unit 7 `MOVE` auf (2,4), dann `ACTION` und `BASIC_ATTACK` auf Unit 2.", () => {
    const plan = planAiActivation(createGreyboxLevel(), 7);

    expect(plan).toEqual({
      inputs: [{ type: "MOVE", to: { x: 2, y: 4 } }, { type: "ACTION" }],
      action: { type: "BASIC_ATTACK", attackerId: 7, targetId: 2 },
    });
  });

  it("Im Startzustand des Greybox-Levels plant Unit 6 `MOVE` auf (7,5), dann `WAIT`, ohne Aktion.", () => {
    const plan = planAiActivation(createGreyboxLevel(), 6);

    expect(plan).toEqual({
      inputs: [{ type: "MOVE", to: { x: 7, y: 5 } }, { type: "WAIT" }],
      action: null,
    });
  });

  it("Der übergebene Spielzustand ist nach dem Aufruf unverändert.", () => {
    const state = createGreyboxLevel();
    const before = structuredClone(state);

    planAiActivation(state, 7);
    planAiActivation(state, 6);

    expect(state).toEqual(before);
  });

  it("Steht die gewählte Angriffsoption auf dem aktuellen Feld der Einheit, enthält der Plan kein `MOVE`.", () => {
    const knight = createUnit(template("knight"), {
      id: 1,
      team: "player",
      position: { x: 4, y: 4 },
    });
    const enemy = createUnit(template("enemy-melee"), {
      id: 5,
      team: "enemy",
      position: { x: 4, y: 5 },
    });
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight, enemy],
    });
    const expected = expectedPlan(state, 1);

    const plan = planAiActivation(state, 1);

    // Die gewählte Option steht auf dem aktuellen Feld (4,4).
    expect(expected.inputs).toEqual([{ type: "ACTION" }]);
    expect(plan.inputs.some(({ type }) => type === "MOVE")).toBe(false);
    expect(plan).toEqual(expected);
  });

  it("Für jede Aktivierung eines ganzen Greybox-Kampfs liefert `planAiActivation` denselben Plan wie die Zusammensetzung der bestehenden Bausteine: Gibt es Optionen aus `attackOptions`, die mit `scoreAttackOption` und `totalDamage` bewertete und mit `chooseAttackOption` gewählte Option, sonst die Eingaben aus `approachNearestEnemy`. Die erwarteten Pläne berechnet der Test aus diesen Bausteinen, nicht als feste Werte.", () => {
    let state = createGreyboxLevel();
    let activations = 0;

    for (
      let round = 1;
      round <= ROUND_LIMIT && combatStatus(state) === "ongoing";
      round += 1
    ) {
      let order = startRound(state);
      for (;;) {
        const activation = nextActivation(state, order);
        order = activation.round;
        const { unitId } = activation;
        if (unitId === null) {
          break;
        }
        const expected = expectedPlan(state, unitId);
        expect(planAiActivation(state, unitId)).toEqual(expected);
        state = applyPlan(state, unitId, expected);
        activations += 1;
        if (combatStatus(state) !== "ongoing") {
          break;
        }
      }
    }

    expect(activations).toBeGreaterThan(0);
  });
});
