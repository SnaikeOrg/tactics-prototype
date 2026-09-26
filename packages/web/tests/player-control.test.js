import { describe, expect, it } from "vitest";
import { createGreyboxLevel, reachableTiles } from "@tactics/core";
import {
  applyControlInput,
  createControlView,
  startPlayerControl,
} from "../src/index.js";

/**
 * @param {import("../src/player-control.js").PlayerControl} control
 * @param {number} unitId
 */
function positionOf(control, unitId) {
  return control.combat.state.units.find(({ id }) => id === unitId)?.position;
}

describe("player control", () => {
  it("Markiert sind genau die Felder aus `reachableTiles(state, 3)`, 23 Felder.", () => {
    const state = createGreyboxLevel();
    const view = createControlView(startPlayerControl(state));

    expect(view.movableTiles).toEqual(
      reachableTiles(state, 3).map(({ position }) => position),
    );
    expect(view.movableTiles).toHaveLength(23);
  });

  it("Ein Klick auf das markierte Feld (3,7) bewegt Unit 3 von (2,9) nach (3,7). Danach sind keine Felder mehr zur Bewegung markiert.", () => {
    const control = startPlayerControl(createGreyboxLevel());
    expect(positionOf(control, 3)).toEqual({ x: 2, y: 9 });

    const moved = applyControlInput(control, {
      type: "CLICK_TILE",
      position: { x: 3, y: 7 },
    });

    expect(positionOf(moved, 3)).toEqual({ x: 3, y: 7 });
    expect(createControlView(moved).movableTiles).toEqual([]);
  });

  it("Ein Klick auf ein nicht markiertes Feld ändert weder Spielzustand noch aktive Einheit.", () => {
    const control = startPlayerControl(createGreyboxLevel());
    const next = applyControlInput(control, {
      type: "CLICK_TILE",
      position: { x: 0, y: 0 },
    });

    expect(next.combat.state).toEqual(control.combat.state);
    expect(createControlView(next).activeUnitId).toBe(3);
  });

  it("Die angezeigte Initiative-Reihenfolge von Runde 1 lautet 7, 3, 6, 2, 8, 4, 5, 1.", () => {
    const view = createControlView(startPlayerControl(createGreyboxLevel()));

    expect(view.round).toBe(1);
    expect(view.initiativeOrder).toEqual([7, 3, 6, 2, 8, 4, 5, 1]);
  });
});
