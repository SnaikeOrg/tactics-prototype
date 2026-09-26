import { describe, expect, it } from "vitest";
import { applyDamage, createGreyboxLevel } from "@tactics/core";
import { createBoardView } from "../src/index.js";

/**
 * @param {import("../src/board-view.js").BoardView} view
 * @param {number} x
 * @param {number} y
 */
function tileAt(view, x, y) {
  return view.tiles.find((tile) => tile.x === x && tile.y === y);
}

describe("createBoardView", () => {
  it("Das Anzeigemodell des Greybox-Levels hat 100 Felder, 10 Spalten und 10 Zeilen.", () => {
    const view = createBoardView(createGreyboxLevel());

    expect(view.tiles).toHaveLength(100);
    expect(view.columns).toBe(10);
    expect(view.rows).toBe(10);
  });

  it("Feld (1,1) ist Forest, Feld (3,3) High Ground, Feld (0,4) Wall, Feld (0,0) Ground.", () => {
    const view = createBoardView(createGreyboxLevel());

    expect(tileAt(view, 1, 1)?.terrain).toBe("Forest");
    expect(tileAt(view, 3, 3)?.terrain).toBe("High Ground");
    expect(tileAt(view, 0, 4)?.terrain).toBe("Wall");
    expect(tileAt(view, 0, 0)?.terrain).toBe("Ground");
  });

  it("Feld (4,8) zeigt Unit 1, Knight, Team Spieler, 48/48 HP. Feld (7,0) zeigt Unit 8, Enemy Mage, Team Gegner, 30/30 HP.", () => {
    const view = createBoardView(createGreyboxLevel());

    expect(tileAt(view, 4, 8)?.unit).toMatchObject({
      id: 1,
      className: "Knight",
      team: "Spieler",
      hp: 48,
      maxHp: 48,
    });
    expect(tileAt(view, 7, 0)?.unit).toMatchObject({
      id: 8,
      className: "Enemy Mage",
      team: "Gegner",
      hp: 30,
      maxHp: 30,
    });
  });

  it("Felder ohne Einheit zeigen keine Einheit. Insgesamt zeigt das Modell 8 Einheiten.", () => {
    const state = createGreyboxLevel();
    const view = createBoardView(state);
    const occupied = new Set(
      state.units.map(({ position }) => `${position.x},${position.y}`),
    );

    for (const tile of view.tiles) {
      if (!occupied.has(`${tile.x},${tile.y}`)) {
        expect(tile.unit).toBeNull();
      }
    }
    expect(view.tiles.filter((tile) => tile.unit !== null)).toHaveLength(8);
  });

  it("Nach `applyDamage` von 10 auf Unit 1 zeigt Feld (4,8) 38/48 HP.", () => {
    const { state } = applyDamage(createGreyboxLevel(), 1, 10);
    const view = createBoardView(state);

    expect(tileAt(view, 4, 8)?.unit).toMatchObject({ hp: 38, maxHp: 48 });
  });
});
