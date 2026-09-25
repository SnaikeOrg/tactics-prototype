import { describe, expect, it } from "vitest";
import {
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
  scoreAttackOption,
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
 * Angreifer (Unit-ID 1, Team enemy) auf (4,4) und Ziel (Unit-ID 2, Team
 * player). Liefert den Score des Angriffs ohne Bewegung auf das Ziel.
 *
 * @param {{ attacker: string, target: string, targetAt: { x: number, y: number }, hp?: number }} setup
 * @returns {number}
 */
function scoreFromStand({ attacker, target, targetAt, hp }) {
  const attackerAt = { x: 4, y: 4 };
  const targetUnit = createUnit(template(target), {
    id: 2,
    team: "player",
    position: targetAt,
  });
  const state = createGameState({
    map: createMap(10, 10),
    units: [
      createUnit(template(attacker), {
        id: 1,
        team: "enemy",
        position: attackerAt,
      }),
      hp === undefined ? targetUnit : { ...targetUnit, hp },
    ],
  });
  return scoreAttackOption(state, 1, {
    position: attackerAt,
    cost: 0,
    targetId: 2,
  });
}

describe("scoreAttackOption", () => {
  it("Enemy Melee (ATK 14) greift angrenzend einen Knight (DEF 10) mit 3/48 HP an → Score 143 (100 + 40 + 3).", () => {
    expect(
      scoreFromStand({
        attacker: "enemy-melee",
        target: "knight",
        targetAt: { x: 5, y: 4 },
        hp: 3,
      }),
    ).toBe(143);
  });

  it("Derselbe Angriff auf einen Knight mit 48/48 HP → Score 4.", () => {
    expect(
      scoreFromStand({
        attacker: "enemy-melee",
        target: "knight",
        targetAt: { x: 5, y: 4 },
        hp: 48,
      }),
    ).toBe(4);
  });

  it("Ein Knight mit 23/48 HP bringt +40, ein Knight mit 24/48 HP nicht.", () => {
    const full = scoreFromStand({
      attacker: "enemy-melee",
      target: "knight",
      targetAt: { x: 5, y: 4 },
      hp: 48,
    });
    const at23 = scoreFromStand({
      attacker: "enemy-melee",
      target: "knight",
      targetAt: { x: 5, y: 4 },
      hp: 23,
    });
    const at24 = scoreFromStand({
      attacker: "enemy-melee",
      target: "knight",
      targetAt: { x: 5, y: 4 },
      hp: 24,
    });

    expect(at23 - full).toBe(40);
    expect(at24 - full).toBe(0);
  });

  it("Enemy Melee greift angrenzend einen Healer (DEF 4) mit 30/30 HP an → Score 40 (30 + 10 Schaden).", () => {
    expect(
      scoreFromStand({
        attacker: "enemy-melee",
        target: "healer",
        targetAt: { x: 5, y: 4 },
        hp: 30,
      }),
    ).toBe(40);
  });

  it("Enemy Spearman (ATK 15) greift einen Knight (DEF 10) mit vollen HP an → Score 15 aus Distanz 2, Score 5 aus Distanz 1.", () => {
    expect(
      scoreFromStand({
        attacker: "enemy-spearman",
        target: "knight",
        targetAt: { x: 6, y: 4 },
      }),
    ).toBe(15);
    expect(
      scoreFromStand({
        attacker: "enemy-spearman",
        target: "knight",
        targetAt: { x: 5, y: 4 },
      }),
    ).toBe(5);
  });
});
