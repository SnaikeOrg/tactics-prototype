import { describe, expect, it } from "vitest";
import {
  applyDamage,
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
 * @param {number} hp
 */
function stateWithTarget(hp) {
  const template = knightTemplate();
  const attacker = createUnit(template, {
    id: 1,
    team: "player",
    position: { x: 0, y: 0 },
  });
  const target = createUnit(template, {
    id: 2,
    team: "enemy",
    position: { x: 1, y: 0 },
  });
  target.hp = hp;

  return createGameState({ map: createMap(10, 10), units: [attacker, target] });
}

describe("Besiegte Einheiten entfernen", () => {
  it("Eine Einheit mit 5 HP, die 5 Schaden erhält, ist besiegt.", () => {
    const { defeated } = applyDamage(stateWithTarget(5), 2, 5);

    expect(defeated).toBe(true);
  });

  it("Eine Einheit mit 3 HP, die 5 Schaden erhält, ist besiegt.", () => {
    const { defeated } = applyDamage(stateWithTarget(3), 2, 5);

    expect(defeated).toBe(true);
  });

  it("Das Feld einer besiegten Einheit gilt als frei und kann von einer anderen Einheit belegt werden.", () => {
    const { state } = applyDamage(stateWithTarget(5), 2, 5);
    const newcomer = createUnit(knightTemplate(), {
      id: 3,
      team: "player",
      position: { x: 1, y: 0 },
    });

    expect(() =>
      createGameState({ map: state.map, units: [...state.units, newcomer] }),
    ).not.toThrow();
  });

  it("Nach dem Besiegen enthält der GameState die Einheit nicht mehr.", () => {
    const { state } = applyDamage(stateWithTarget(5), 2, 5);

    expect(state.units.map(({ id }) => id)).not.toContain(2);
  });
});
