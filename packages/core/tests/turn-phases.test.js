import { describe, expect, it } from "vitest";
import {
  applyTurnInput,
  beginActivation,
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
} from "../src/index.js";

/** @returns {ReturnType<typeof loadUnitTemplates>[number]} */
function knightTemplate() {
  // §20.1: Knight hat MOV 4.
  const knight = loadUnitTemplates().find(({ id }) => id === "knight");
  if (!knight) {
    throw new Error("Knight-Vorlage fehlt");
  }
  return knight;
}

/**
 * @param {number} id
 * @param {number} x
 * @param {number} y
 */
function knight(id, x, y) {
  return createUnit(knightTemplate(), {
    id,
    team: "player",
    position: { x, y },
  });
}

describe("Zugphasen einer Aktivierung", () => {
  it("MOVE auf ein erreichbares Feld, danach ACTION → beide werden akzeptiert.", () => {
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, 0, 0)],
    });

    const move = applyTurnInput(state, beginActivation(1), {
      type: "MOVE",
      to: { x: 1, y: 1 },
    });
    const action = applyTurnInput(move.state, move.activation, {
      type: "ACTION",
    });

    expect(move.accepted).toBe(true);
    expect(action.accepted).toBe(true);
  });

  it("ACTION ohne vorheriges MOVE → akzeptiert.", () => {
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, 0, 0)],
    });

    const action = applyTurnInput(state, beginActivation(1), {
      type: "ACTION",
    });

    expect(action.accepted).toBe(true);
  });

  it("MOVE nach ACTION → abgelehnt.", () => {
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, 0, 0)],
    });

    const action = applyTurnInput(state, beginActivation(1), {
      type: "ACTION",
    });
    const move = applyTurnInput(action.state, action.activation, {
      type: "MOVE",
      to: { x: 1, y: 1 },
    });

    expect(move.accepted).toBe(false);
  });

  it("Nach WAIT wird jede weitere Eingabe abgelehnt, die Aktivierung ist beendet.", () => {
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, 0, 0)],
    });

    const wait = applyTurnInput(state, beginActivation(1), { type: "WAIT" });
    /** @type {import("../src/turn-phases.js").TurnInput[]} */
    const inputs = [
      { type: "MOVE", to: { x: 1, y: 1 } },
      { type: "ACTION" },
      { type: "WAIT" },
    ];

    expect(wait.accepted).toBe(true);
    expect(wait.activation.ended).toBe(true);
    for (const input of inputs) {
      expect(applyTurnInput(wait.state, wait.activation, input).accepted).toBe(
        false,
      );
    }
  });

  it("MOVE auf ein Feld mit Kosten 5 bei MOV 4 → abgelehnt.", () => {
    // Ground → Forest → Forest: 1 + 2 + 2 = 5 (§3, §4).
    const state = createGameState({
      map: createMap(4, 1, ["GROUND", "GROUND", "FOREST", "FOREST"]),
      units: [knight(1, 0, 0)],
    });

    const move = applyTurnInput(state, beginActivation(1), {
      type: "MOVE",
      to: { x: 3, y: 0 },
    });

    expect(move.accepted).toBe(false);
  });
});
