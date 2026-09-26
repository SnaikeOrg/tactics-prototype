import { describe, expect, it } from "vitest";
import { applyDamage, createGreyboxLevel } from "@tactics/core";
import {
  applyControlInput,
  createControlView,
  startPlayerControl,
} from "../src/index.js";

/**
 * @param {import("../src/player-control.js").PlayerControl} control
 * @param {number} unitId
 */
function unitOf(control, unitId) {
  return control.combat.state.units.find(({ id }) => id === unitId);
}

/**
 * Greybox-Level mit nur den genannten Einheiten; `lowHpUnitId` hat 1 HP.
 *
 * @param {number[]} keepIds
 * @param {number} lowHpUnitId
 */
function reducedGreybox(keepIds, lowHpUnitId) {
  const level = createGreyboxLevel();
  const state = {
    map: level.map,
    units: level.units.filter(({ id }) => keepIds.includes(id)),
  };
  const unit = state.units.find(({ id }) => id === lowHpUnitId);
  if (!unit) {
    throw new Error(`Unit ${lowHpUnitId} fehlt`);
  }
  return applyDamage(state, lowHpUnitId, unit.hp - 1).state;
}

/**
 * Prüft, dass Klicks auf Felder den Spielzustand nicht mehr ändern.
 *
 * @param {import("../src/player-control.js").PlayerControl} control
 */
function expectClicksIgnored(control) {
  for (const position of [
    { x: 0, y: 0 },
    { x: 2, y: 6 },
    { x: 4, y: 1 },
  ]) {
    const next = applyControlInput(control, { type: "CLICK_TILE", position });
    expect(next.combat.state).toEqual(control.combat.state);
  }
}

describe("enemy turns", () => {
  it("Nach dem Start hat Unit 7 gezogen: von (2,0) nach (2,4), `BASIC_ATTACK` auf Unit 2 mit 9 Schaden, Unit 2 hat 31 HP. Danach ist Unit 3 aktiv.", () => {
    const control = startPlayerControl(createGreyboxLevel());

    expect(control.log?.[0]).toMatchObject({
      unitId: 7,
      from: { x: 2, y: 0 },
      to: { x: 2, y: 4 },
      action: { type: "BASIC_ATTACK", targetId: 2, damage: 9 },
      targetHp: 31,
    });
    expect(unitOf(control, 7)?.position).toEqual({ x: 2, y: 4 });
    expect(unitOf(control, 2)?.hp).toBe(31);
    expect(createControlView(control).activeUnitId).toBe(3);
  });

  it("Das Log enthält danach genau einen Eintrag, den für Unit 7.", () => {
    const control = startPlayerControl(createGreyboxLevel());

    expect(control.log).toHaveLength(1);
    expect(control.log?.[0]?.unitId).toBe(7);
  });

  it("Beendet Unit 3 ihre Aktivierung mit `Warten` ohne Bewegung, zieht Unit 6 von (5,1) nach (7,5) und wartet. Danach ist Unit 2 aktiv, und das Log enthält drei Einträge.", () => {
    const control = startPlayerControl(createGreyboxLevel());
    expect(unitOf(control, 6)?.position).toEqual({ x: 5, y: 1 });

    const next = applyControlInput(control, { type: "WAIT" });

    expect(unitOf(next, 6)?.position).toEqual({ x: 7, y: 5 });
    expect(next.log?.[2]).toMatchObject({
      unitId: 6,
      from: { x: 5, y: 1 },
      to: { x: 7, y: 5 },
      action: { type: "WAIT" },
    });
    expect(createControlView(next).activeUnitId).toBe(2);
    expect(next.log).toHaveLength(3);
  });

  it("Ist nach einer Aktivierung keine gegnerische Einheit mehr im Spielzustand, zeigt der Renderer `SIEG`. Ist keine Spielerfigur mehr im Spielzustand, zeigt er `NIEDERLAGE`. In beiden Fällen ändern Klicks auf Felder den Spielzustand nicht mehr.", () => {
    // Sieg: Unit 3 besiegt mit ihrer Basic Attack die letzte gegnerische Einheit.
    const start = startPlayerControl(reducedGreybox([1, 2, 3, 4, 5], 5));
    expect(createControlView(start).activeUnitId).toBe(3);
    const moved = applyControlInput(start, {
      type: "CLICK_TILE",
      position: { x: 2, y: 5 },
    });
    const forecast = applyControlInput(moved, {
      type: "CLICK_TILE",
      position: { x: 4, y: 1 },
    });
    const victory = applyControlInput(forecast, { type: "CONFIRM" });

    expect(
      victory.combat.state.units.filter(({ team }) => team === "enemy"),
    ).toEqual([]);
    expect(createControlView(victory).result).toBe("SIEG");
    expectClicksIgnored(victory);

    // Niederlage: Unit 7 besiegt die letzte Spielerfigur.
    const defeat = startPlayerControl(reducedGreybox([2, 5, 6, 7, 8], 2));

    expect(
      defeat.combat.state.units.filter(({ team }) => team === "player"),
    ).toEqual([]);
    expect(createControlView(defeat).result).toBe("NIEDERLAGE");
    expectClicksIgnored(defeat);
  });

  it("`Neu starten` stellt die Lage aus dem ersten Abnahmepunkt wieder her, mit leerem Log bis auf den Eintrag für Unit 7.", () => {
    const played = applyControlInput(startPlayerControl(createGreyboxLevel()), {
      type: "WAIT",
    });
    const restarted = applyControlInput(played, { type: "RESTART" });

    expect(unitOf(restarted, 7)?.position).toEqual({ x: 2, y: 4 });
    expect(unitOf(restarted, 2)?.hp).toBe(31);
    expect(createControlView(restarted).activeUnitId).toBe(3);
    expect(restarted.log).toHaveLength(1);
    expect(restarted.log?.[0]).toMatchObject({
      unitId: 7,
      from: { x: 2, y: 0 },
      to: { x: 2, y: 4 },
      action: { type: "BASIC_ATTACK", targetId: 2, damage: 9 },
      targetHp: 31,
    });
  });
});
