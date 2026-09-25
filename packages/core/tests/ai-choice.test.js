import { describe, expect, it } from "vitest";
import { chooseAttackOption, createMap } from "../src/index.js";

/**
 * Bewertete Angriffsoption mit Vorgabewerten, die in allen Kriterien gleich
 * sind, damit jeder Test genau ein Kriterium unterscheidet.
 *
 * @param {Partial<import("../src/ai-options.js").ScoredAttackOption>} overrides
 * @returns {import("../src/ai-options.js").ScoredAttackOption}
 */
function option(overrides) {
  return {
    position: { x: 4, y: 4 },
    cost: 1,
    targetId: 2,
    score: 40,
    totalDamage: 10,
    ...overrides,
  };
}

describe("chooseAttackOption", () => {
  it("Zwei Optionen mit Score 40: Gesamtschaden 10 wird Gesamtschaden 8 vorgezogen.", () => {
    const eight = option({ score: 40, totalDamage: 8 });
    const ten = option({ score: 40, totalDamage: 10 });

    expect(chooseAttackOption(createMap(10, 10), [eight, ten])).toBe(ten);
  });

  it("Gleicher Score und Gesamtschaden: Bewegungskosten 1 werden Bewegungskosten 2 vorgezogen.", () => {
    const two = option({ cost: 2 });
    const one = option({ cost: 1 });

    expect(chooseAttackOption(createMap(10, 10), [two, one])).toBe(one);
  });

  it("Gleicher Score, Schaden und Bewegungskosten: Ziel mit Unit-ID 2 wird Ziel mit Unit-ID 3 vorgezogen.", () => {
    const three = option({ targetId: 3 });
    const two = option({ targetId: 2 });

    expect(chooseAttackOption(createMap(10, 10), [three, two])).toBe(two);
  });

  it("Gleiches Ziel und gleiche Bewegungskosten von den Standfeldern (3,1) und (5,1) auf der 10×10-Karte → Standfeld (3,1) (Tile-ID 13 statt 15).", () => {
    const at51 = option({ position: { x: 5, y: 1 } });
    const at31 = option({ position: { x: 3, y: 1 } });

    expect(chooseAttackOption(createMap(10, 10), [at51, at31])).toBe(at31);
  });
});
