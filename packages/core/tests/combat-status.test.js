import { describe, expect, it } from "vitest";
import {
  applyDamage,
  combatStatus,
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
} from "../src/index.js";

/** @returns {ReturnType<typeof loadUnitTemplates>[number]} */
function knightTemplate() {
  const knight = loadUnitTemplates().find(({ id }) => id === "knight");
  if (!knight) {
    throw new Error("Knight-Vorlage fehlt");
  }
  return knight;
}

/**
 * @param {number} id
 * @param {import("../src/unit.js").Team} team
 * @param {number} x
 */
function knight(id, team, x) {
  return createUnit(knightTemplate(), { id, team, position: { x, y: 0 } });
}

describe("Sieg und Niederlage", () => {
  it("Der letzte lebende Gegner wird besiegt → Sieg.", () => {
    const enemy = knight(2, "enemy", 1);
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, "player", 0), enemy],
    });

    const { state: after } = applyDamage(state, 2, enemy.hp);

    expect(combatStatus(after)).toBe("victory");
  });

  it("Die letzte lebende Spielerfigur wird besiegt → Niederlage.", () => {
    const player = knight(1, "player", 0);
    const state = createGameState({
      map: createMap(10, 10),
      units: [player, knight(2, "enemy", 1)],
    });

    const { state: after } = applyDamage(state, 1, player.hp);

    expect(combatStatus(after)).toBe("defeat");
  });

  it("Je eine lebende Einheit pro Team → Kampf läuft.", () => {
    const state = createGameState({
      map: createMap(10, 10),
      units: [knight(1, "player", 0), knight(2, "enemy", 1)],
    });

    expect(combatStatus(state)).toBe("ongoing");
  });
});
