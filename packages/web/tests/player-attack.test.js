import { describe, expect, it } from "vitest";
import { createGreyboxLevel } from "@tactics/core";
import {
  applyControlInput,
  createAttackView,
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
 * Ausgangslage wie in #65: Unit 3 ist aktiv und per Klick von (2,9) nach
 * (2,5) bewegt.
 */
function movedToAttack() {
  const control = startPlayerControl(createGreyboxLevel());
  expect(createControlView(control).activeUnitId).toBe(3);
  expect(unitOf(control, 3)?.position).toEqual({ x: 2, y: 9 });
  const moved = applyControlInput(control, {
    type: "CLICK_TILE",
    position: { x: 2, y: 5 },
  });
  expect(unitOf(moved, 3)?.position).toEqual({ x: 2, y: 5 });
  return moved;
}

/**
 * @param {import("../src/player-control.js").PlayerControl} control
 * @param {number} unitId
 */
function clickUnit(control, unitId) {
  const position = unitOf(control, unitId)?.position;
  if (!position) {
    throw new Error(`Unit ${unitId} ist nicht im Spielzustand`);
  }
  return applyControlInput(control, { type: "CLICK_TILE", position });
}

describe("player attack", () => {
  it("Ausgangslage wie in #65: Unit 3 ist aktiv und per Klick von (2,9) nach (2,5) bewegt. Als Ziele markiert sind genau Unit 5 und Unit 6.", () => {
    const control = movedToAttack();

    expect(createControlView(control).activeUnitId).toBe(3);
    expect(createAttackView(control).targetIds).toEqual([5, 6]);
  });

  it("Ein Klick auf Unit 5 zeigt den Forecast 38 → 28, Schaden 10, nicht tödlich. Der Spielzustand ist unverändert.", () => {
    const control = movedToAttack();
    const next = clickUnit(control, 5);

    expect(createAttackView(next).forecast).toEqual({
      targetId: 5,
      targetHpBefore: 38,
      targetHpAfter: 28,
      damage: 10,
      lethal: false,
    });
    expect(next.combat.state).toEqual(control.combat.state);
  });

  it("`Abbrechen` schliesst den Forecast. Spielzustand und aktive Einheit sind unverändert, Unit 5 und Unit 6 bleiben als Ziele markiert.", () => {
    const control = movedToAttack();
    const cancelled = applyControlInput(clickUnit(control, 5), {
      type: "CANCEL",
    });

    expect(createAttackView(cancelled).forecast).toBeNull();
    expect(cancelled.combat.state).toEqual(control.combat.state);
    expect(createControlView(cancelled).activeUnitId).toBe(3);
    expect(createAttackView(cancelled).targetIds).toEqual([5, 6]);
  });

  it("Ein Klick auf Unit 5 und `Bestätigen` setzen Unit 5 auf 28 HP und beenden die Aktivierung von Unit 3.", () => {
    const control = movedToAttack();
    const confirmed = applyControlInput(clickUnit(control, 5), {
      type: "CONFIRM",
    });

    expect(unitOf(confirmed, 5)?.hp).toBe(28);
    expect(createControlView(confirmed).activeUnitId).not.toBe(3);
    expect(confirmed.combat.initiative.order.indexOf(3)).toBeLessThan(
      confirmed.combat.initiative.next,
    );
  });

  it("Ein Klick auf Unit 7, die kein gültiges Ziel ist, zeigt keinen Forecast und ändert nichts.", () => {
    const control = movedToAttack();
    const next = clickUnit(control, 7);

    expect(createAttackView(next).forecast).toBeNull();
    expect(next).toEqual(control);
    expect(createAttackView(next)).toEqual(createAttackView(control));
  });
});
