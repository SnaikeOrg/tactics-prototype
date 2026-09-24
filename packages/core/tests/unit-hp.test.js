import { describe, expect, it } from "vitest";
import { createUnit, loadUnitTemplates } from "../src/index.js";

/** @returns {ReturnType<typeof createUnit>} */
function createKnight() {
  const knight = loadUnitTemplates().find(({ id }) => id === "knight");
  if (!knight) {
    throw new Error("Knight-Vorlage fehlt");
  }
  return createUnit(knight, {
    id: 1,
    team: "player",
    position: { x: 0, y: 0 },
  });
}

describe("HP und MaxHP", () => {
  it("Eine Einheit aus der Knight-Vorlage hat `hp` 48 und `maxHp` 48.", () => {
    const unit = createKnight();

    expect(unit.hp).toBe(48);
    expect(unit.maxHp).toBe(48);
  });

  it("Wird `hp` einer Knight-Einheit auf 20 gesetzt, bleibt `maxHp` bei 48.", () => {
    const unit = createKnight();

    unit.hp = 20;

    expect(unit.hp).toBe(20);
    expect(unit.maxHp).toBe(48);
  });
});
