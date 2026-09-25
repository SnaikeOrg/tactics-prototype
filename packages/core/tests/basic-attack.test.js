import { describe, expect, it } from "vitest";
import {
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
  resolveAction,
} from "../src/index.js";

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
 * Knight (Unit-ID 1) greift Enemy Melee (Unit-ID 2) an, auf einer 10×10-Karte.
 *
 * @param {{ x: number, y: number }} targetAt
 * @param {number} [targetHp]
 */
function knightVsEnemyMelee(targetAt, targetHp) {
  const attacker = createUnit(template("knight"), {
    id: 1,
    team: "player",
    position: { x: 0, y: 0 },
  });
  const target = createUnit(template("enemy-melee"), {
    id: 2,
    team: "enemy",
    position: targetAt,
  });
  if (targetHp !== undefined) {
    target.hp = targetHp;
  }
  return createGameState({ map: createMap(10, 10), units: [attacker, target] });
}

/** @type {import("../src/resolve-action.js").Action} */
const attack = { type: "BASIC_ATTACK", attackerId: 1, targetId: 2 };

describe("resolveAction: Basic Attack", () => {
  it("Knight (ATK 14, Multiplikator 1.0) greift Enemy Melee (DEF 7, HP 38) an → Ziel hat 31 HP.", () => {
    const state = knightVsEnemyMelee({ x: 1, y: 0 });

    const result = resolveAction(state, attack);

    expect(result.accepted).toBe(true);
    expect(result.state.units.find(({ id }) => id === 2)?.hp).toBe(31);
  });

  it("Ein Ziel mit 5 HP erhält 7 Schaden → Ziel ist besiegt, sein Feld ist frei.", () => {
    const state = knightVsEnemyMelee({ x: 1, y: 0 }, 5);

    const result = resolveAction(state, attack);

    expect(result.accepted).toBe(true);
    expect(result.state.units.some(({ id }) => id === 2)).toBe(false);
    expect(
      result.state.units.some(
        ({ position }) => position.x === 1 && position.y === 0,
      ),
    ).toBe(false);
  });

  it("Die HP des Angreifers sind nach dem Angriff unverändert.", () => {
    const state = knightVsEnemyMelee({ x: 1, y: 0 });

    const result = resolveAction(state, attack);

    expect(result.accepted).toBe(true);
    expect(result.state.units.find(({ id }) => id === 1)?.hp).toBe(
      state.units.find(({ id }) => id === 1)?.hp,
    );
  });

  it("Ein ungültiges Ziel (Distanz 2 bei Reichweite 1–1) wird abgelehnt, der GameState bleibt unverändert.", () => {
    const state = knightVsEnemyMelee({ x: 2, y: 0 });
    const before = structuredClone(state);

    const result = resolveAction(state, attack);

    expect(result.accepted).toBe(false);
    expect(result.state).toEqual(before);
    expect(state).toEqual(before);
  });
});
