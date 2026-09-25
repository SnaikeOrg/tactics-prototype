import { describe, expect, it } from "vitest";
import {
  applyDamage,
  createGameState,
  createMap,
  createUnit,
  loadUnitTemplates,
  nextActivation,
  startRound,
} from "../src/index.js";

/**
 * Greybox-Level aus §25: Unit-ID, Vorlage, Team und Spawn-Feld.
 *
 * @type {{ id: number, templateId: string, team: "player" | "enemy", position: { x: number, y: number } }[]}
 */
const SPAWNS = [
  { id: 1, templateId: "knight", team: "player", position: { x: 4, y: 8 } },
  { id: 2, templateId: "spearman", team: "player", position: { x: 5, y: 8 } },
  { id: 3, templateId: "archer", team: "player", position: { x: 2, y: 9 } },
  { id: 4, templateId: "healer", team: "player", position: { x: 7, y: 9 } },
  {
    id: 5,
    templateId: "enemy-melee",
    team: "enemy",
    position: { x: 4, y: 1 },
  },
  {
    id: 6,
    templateId: "enemy-spearman",
    team: "enemy",
    position: { x: 5, y: 1 },
  },
  {
    id: 7,
    templateId: "enemy-archer",
    team: "enemy",
    position: { x: 2, y: 0 },
  },
  { id: 8, templateId: "enemy-mage", team: "enemy", position: { x: 7, y: 0 } },
];

function greyboxState() {
  const templates = loadUnitTemplates();
  const units = SPAWNS.map(({ id, templateId, team, position }) => {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) {
      throw new Error(`Vorlage ${templateId} fehlt`);
    }
    return createUnit(template, { id, team, position });
  });

  return createGameState({ map: createMap(10, 10), units });
}

/**
 * Spielt eine Runde bis zum Ende durch und liefert die aktivierten Unit-IDs.
 *
 * @param {import("../src/game-state.js").GameState} state
 * @param {import("../src/initiative.js").Round} round
 * @returns {number[]}
 */
function remainingActivations(state, round) {
  /** @type {number[]} */
  const activated = [];
  let current = round;
  for (;;) {
    const { unitId, round: after } = nextActivation(state, current);
    if (unitId === null) {
      return activated;
    }
    activated.push(unitId);
    current = after;
  }
}

describe("Runden und Initiative", () => {
  it("Enemy Archer (SPD 10) ist vor Archer (SPD 9) an der Reihe.", () => {
    const state = greyboxState();
    const order = remainingActivations(state, startRound(state));

    expect(order.indexOf(7)).toBeLessThan(order.indexOf(3));
  });

  it("Bei SPD 6 zieht Healer (Unit-ID 4) vor Enemy Melee (Unit-ID 5).", () => {
    const state = greyboxState();
    const order = remainingActivations(state, startRound(state));

    expect(order.indexOf(4)).toBeLessThan(order.indexOf(5));
  });

  it("Mit 8 lebenden Einheiten hat eine Runde genau 8 Aktivierungen, jede Einheit einmal.", () => {
    const state = greyboxState();
    const order = remainingActivations(state, startRound(state));

    expect(order).toHaveLength(8);
    expect([...order].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("Eine Einheit, die besiegt wird, bevor sie in der Runde an der Reihe war, erhält keine Aktivierung.", () => {
    const initial = greyboxState();
    const round = startRound(initial);
    const first = nextActivation(initial, round);
    const knight = initial.units.find(({ id }) => id === 1);
    if (!knight) {
      throw new Error("Knight fehlt");
    }
    const { state, defeated } = applyDamage(initial, 1, knight.hp);

    expect(first.unitId).not.toBe(1);
    expect(defeated).toBe(true);
    expect(remainingActivations(state, first.round)).not.toContain(1);
  });

  it("Eine SPD-Änderung während der Runde ändert die Reihenfolge erst ab der nächsten Runde.", () => {
    const initial = greyboxState();
    const round = startRound(initial);
    const before = remainingActivations(initial, round);
    const changed = {
      map: initial.map,
      units: initial.units.map((unit) =>
        unit.id === 1 ? { ...unit, stats: { ...unit.stats, spd: 20 } } : unit,
      ),
    };

    expect(remainingActivations(changed, round)).toEqual(before);
    expect(remainingActivations(changed, startRound(changed))[0]).toBe(1);
  });
});
