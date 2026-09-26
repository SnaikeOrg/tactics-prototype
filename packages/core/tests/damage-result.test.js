import { describe, expect, it } from "vitest";
import {
  calculateDamage,
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
  resolveAction,
  totalDamage,
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
 * Angreifer (Unit-ID 1) auf (4,4) und angrenzendes Ziel (Unit-ID 2) auf (5,4)
 * in gegnerischen Teams, auf einer 10×10-Karte.
 *
 * @param {{ attacker: string, target: string, hp?: number }} setup
 */
function duel({ attacker, target, hp }) {
  const targetUnit = createUnit(template(target), {
    id: 2,
    team: "player",
    position: { x: 5, y: 4 },
  });
  return createGameState({
    map: createMap(10, 10),
    units: [
      createUnit(template(attacker), {
        id: 1,
        team: "enemy",
        position: { x: 4, y: 4 },
      }),
      hp === undefined ? targetUnit : { ...targetUnit, hp },
    ],
  });
}

/**
 * @param {import("../src/game-state.js").GameState} state
 * @param {number} id
 */
function unit(state, id) {
  const found = state.units.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`Unit-ID ${id} fehlt`);
  }
  return found;
}

/** @type {import("../src/resolve-action.js").Action} */
const attack = { type: "BASIC_ATTACK", attackerId: 1, targetId: 2 };

describe("resolveAction: Schaden der Basic Attack", () => {
  it("Eine akzeptierte `BASIC_ATTACK` liefert `damage` gleich dem Wert von `calculateDamage` für Angreifer, Ziel und Basic Attack der Vorlage des Angreifers (§12, §13).", () => {
    const state = duel({ attacker: "knight", target: "enemy-melee" });
    const attacker = unit(state, 1);
    const target = unit(state, 2);

    const result = resolveAction(state, attack);

    expect(result.accepted).toBe(true);
    expect(result.damage).toBe(
      calculateDamage(
        attacker.stats,
        target.stats,
        template(attacker.templateId).basicAttack,
      ),
    );
  });

  it("Eine akzeptierte `BASIC_ATTACK` liefert `targetHp` gleich HP des Ziels vorher minus `damage`.", () => {
    const state = duel({ attacker: "knight", target: "enemy-melee" });
    const hpBefore = unit(state, 2).hp;

    const result = resolveAction(state, attack);

    expect(result.accepted).toBe(true);
    expect(result.damage).toBeTypeOf("number");
    expect(result.targetHp).toBe(hpBefore - (result.damage ?? Number.NaN));
  });

  it("Besiegt die `BASIC_ATTACK` das Ziel, ist `targetHp` 0 oder kleiner und das Ziel nicht mehr im Spielzustand (§18).", () => {
    const state = duel({ attacker: "knight", target: "enemy-melee", hp: 5 });

    const result = resolveAction(state, attack);

    expect(result.accepted).toBe(true);
    expect(result.targetHp).toBeTypeOf("number");
    expect(result.targetHp).toBeLessThanOrEqual(0);
    expect(result.state.units.some(({ id }) => id === 2)).toBe(false);
  });
});

describe("totalDamage", () => {
  it("Der Gesamtschaden einer Angriffsoption ist min(Schaden, verbleibende HP des Ziels): Übersteigt der Schaden die HP des Ziels, ist er gleich den HP, sonst gleich dem Schaden.", () => {
    const option = { position: { x: 4, y: 4 }, cost: 0, targetId: 2 };
    const damage = calculateDamage(
      template("enemy-melee").stats,
      template("knight").stats,
      template("enemy-melee").basicAttack,
    );

    const wounded = duel({
      attacker: "enemy-melee",
      target: "knight",
      hp: damage - 1,
    });
    expect(totalDamage(wounded, 1, option)).toBe(damage - 1);

    const full = duel({ attacker: "enemy-melee", target: "knight" });
    expect(unit(full, 2).hp).toBeGreaterThan(damage);
    expect(totalDamage(full, 1, option)).toBe(damage);
  });
});
