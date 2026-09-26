import { describe, expect, it } from "vitest";
import {
  applyTurnInput,
  beginActivation,
  createGreyboxLevel,
  planAiActivation,
  resolveAction,
} from "@tactics/core";
import { runCombat } from "../src/index.js";

/** Simulationsparameter des Tests, keine Balancing-Zahl. */
const ROUND_LIMIT = 50;

/**
 * @typedef {import("../../core/src/game-state.js").GameState} GameState
 * @typedef {ReturnType<typeof runCombat>["log"][number]} LogEntry
 */

/**
 * Wendet einen Log-Eintrag mit den Bausteinen aus `core` an, unabhängig von
 * `planAiActivation`.
 *
 * @param {GameState} start
 * @param {LogEntry} entry
 * @returns {GameState}
 */
function applyEntry(start, entry) {
  let state = start;
  let phase = beginActivation(entry.unitId);
  if (entry.to.x !== entry.from.x || entry.to.y !== entry.from.y) {
    const moved = applyTurnInput(state, phase, { type: "MOVE", to: entry.to });
    expect(moved.accepted).toBe(true);
    state = moved.state;
    phase = moved.activation;
  }
  if (entry.action.type === "BASIC_ATTACK") {
    const acted = applyTurnInput(state, phase, { type: "ACTION" });
    expect(acted.accepted).toBe(true);
    const resolved = resolveAction(acted.state, {
      type: "BASIC_ATTACK",
      attackerId: entry.unitId,
      targetId: entry.action.targetId,
    });
    expect(resolved.accepted).toBe(true);
    return resolved.state;
  }
  const waited = applyTurnInput(state, phase, { type: "WAIT" });
  expect(waited.accepted).toBe(true);
  return waited.state;
}

describe("runCombat nutzt planAiActivation", () => {
  it("Jeder Eintrag im Log von `runCombat({ roundLimit: 50 })` entspricht dem Plan von `planAiActivation` für den Spielzustand vor dieser Aktivierung: Standfeld nach der Bewegung, Aktion und Ziel.", () => {
    const { log } = runCombat({ roundLimit: ROUND_LIMIT });
    let state = createGreyboxLevel();

    expect(log.length).toBeGreaterThan(0);
    for (const entry of log) {
      const plan = planAiActivation(state, entry.unitId);
      const move = plan.inputs.find((input) => input.type === "MOVE");
      const to = move?.type === "MOVE" ? move.to : entry.from;

      expect(entry.to).toEqual(to);
      if (plan.action) {
        expect(entry.action.type).toBe(plan.action.type);
        expect(
          entry.action.type === "BASIC_ATTACK" ? entry.action.targetId : null,
        ).toBe(plan.action.targetId);
      } else {
        expect(entry.action).toEqual({ type: "WAIT" });
      }

      state = applyEntry(state, entry);
    }
  });
});
