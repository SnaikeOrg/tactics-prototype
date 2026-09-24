import { describe, expect, it } from "vitest";
import {
  applyDamage,
  createGameState,
  createMap,
  createUnit,
  isValidTarget,
  loadUnitTemplates,
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
 * Angreifer (Unit-ID 1) und eine zweite Einheit (Unit-ID 2) auf einer 10×10-Karte.
 *
 * @param {string} templateId
 * @param {{ x: number, y: number }} attackerAt
 * @param {{ x: number, y: number }} otherAt
 * @param {"player" | "enemy"} otherTeam
 */
function duel(templateId, attackerAt, otherAt, otherTeam) {
  return createGameState({
    map: createMap(10, 10),
    units: [
      createUnit(template(templateId), {
        id: 1,
        team: "player",
        position: attackerAt,
      }),
      createUnit(template("knight"), {
        id: 2,
        team: otherTeam,
        position: otherAt,
      }),
    ],
  });
}

describe("isValidTarget", () => {
  it("Reichweite 2–4, Ziel auf Distanz 1 → ungültig.", () => {
    const state = duel("archer", { x: 0, y: 0 }, { x: 1, y: 0 }, "enemy");
    const ability = /** @type {const} */ ({
      target: "ENEMY",
      minRange: 2,
      maxRange: 4,
    });

    expect(isValidTarget(state, 1, ability, 2)).toBe(false);
  });

  it("Reichweite 1–2, Angreifer auf (0,0), Ziel auf (2,2) → gültig.", () => {
    const state = duel("spearman", { x: 0, y: 0 }, { x: 2, y: 2 }, "enemy");
    const ability = /** @type {const} */ ({
      target: "ENEMY",
      minRange: 1,
      maxRange: 2,
    });

    expect(isValidTarget(state, 1, ability, 2)).toBe(true);
  });

  it("Reichweite bis 4, Ziel auf Distanz 5 → ungültig.", () => {
    // Archer-Basic-Attack (§20.3), Reichweite bis 4.
    const state = duel("archer", { x: 0, y: 0 }, { x: 5, y: 0 }, "enemy");

    expect(isValidTarget(state, 1, template("archer").basicAttack, 2)).toBe(
      false,
    );
  });

  it("Eine verbündete Einheit in Reichweite → ungültig.", () => {
    // Knight-Basic-Attack (§20.1), Verbündeter direkt angrenzend.
    const state = duel("knight", { x: 0, y: 0 }, { x: 1, y: 0 }, "player");

    expect(isValidTarget(state, 1, template("knight").basicAttack, 2)).toBe(
      false,
    );
  });

  it("Eine besiegte gegnerische Einheit ist nicht mehr im GameState und kann nicht als Ziel gewählt werden.", () => {
    const before = duel("knight", { x: 0, y: 0 }, { x: 1, y: 0 }, "enemy");
    const target = before.units.find(({ id }) => id === 2);
    if (!target) {
      throw new Error("Einheit 2 fehlt");
    }
    const { state } = applyDamage(before, 2, target.hp);

    expect(state.units.map(({ id }) => id)).not.toContain(2);
    expect(isValidTarget(state, 1, template("knight").basicAttack, 2)).toBe(
      false,
    );
  });
});
