import { describe, expect, it } from "vitest";
import { calculateDamage } from "../src/index.js";

describe("calculateDamage", () => {
  it("Piercing Thrust: ATK 16 × 1.3 − DEF 7 → 13.", () => {
    expect(
      calculateDamage(
        { atk: 16, mag: 0 },
        { def: 7, res: 0 },
        { damageType: "PHYSICAL", multiplier: 1.3 },
      ),
    ).toBe(13);
  });

  it("Power Strike: ATK 14 × 1.5 − DEF 7 → 14.", () => {
    expect(
      calculateDamage(
        { atk: 14, mag: 0 },
        { def: 7, res: 0 },
        { damageType: "PHYSICAL", multiplier: 1.5 },
      ),
    ).toBe(14);
  });

  it("ATK 6 × 1.0 − DEF 10 → 1 (Mindestschaden).", () => {
    expect(
      calculateDamage(
        { atk: 6, mag: 0 },
        { def: 10, res: 0 },
        { damageType: "PHYSICAL", multiplier: 1.0 },
      ),
    ).toBe(1);
  });

  it("Magisch: MAG 16 × 1.1 − RES 6 → 11.", () => {
    expect(
      calculateDamage(
        { atk: 0, mag: 16 },
        { def: 0, res: 6 },
        { damageType: "MAGIC", multiplier: 1.1 },
      ),
    ).toBe(11);
  });

  it("Magischer Schaden ändert sich nicht, wenn nur ATK oder DEF geändert werden.", () => {
    const magic = /** @type {const} */ ({
      damageType: "MAGIC",
      multiplier: 1.1,
    });
    const baseline = calculateDamage(
      { atk: 0, mag: 16 },
      { def: 0, res: 6 },
      magic,
    );

    expect(
      calculateDamage({ atk: 50, mag: 16 }, { def: 0, res: 6 }, magic),
    ).toBe(baseline);
    expect(
      calculateDamage({ atk: 0, mag: 16 }, { def: 50, res: 6 }, magic),
    ).toBe(baseline);
  });
});
