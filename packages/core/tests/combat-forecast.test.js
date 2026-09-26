import { describe, expect, it } from "vitest";
import {
  applyTurnInput,
  beginActivation,
  createGreyboxLevel,
  previewAction,
  resolveAction,
} from "../src/index.js";

/** @type {import("../src/resolve-action.js").Action} */
const attack = { type: "BASIC_ATTACK", attackerId: 7, targetId: 2 };

/**
 * Greybox-Level (§25), Unit 7 nach MOVE auf (2,4). Optional hat Unit 2
 * andere HP.
 *
 * @param {number} [targetHp]
 * @returns {import("../src/game-state.js").GameState}
 */
function afterMove(targetHp) {
  const move = applyTurnInput(createGreyboxLevel(), beginActivation(7), {
    type: "MOVE",
    to: { x: 2, y: 4 },
  });
  if (!move.accepted) {
    throw new Error("MOVE auf (2,4) wurde abgelehnt");
  }
  if (targetHp === undefined) {
    return move.state;
  }
  return {
    map: move.state.map,
    units: move.state.units.map((unit) =>
      unit.id === 2 ? { ...unit, hp: targetHp } : unit,
    ),
  };
}

describe("previewAction: Combat Forecast der Basic Attack", () => {
  it("Greybox-Level, Unit 7 nach `MOVE` auf (2,4), `BASIC_ATTACK` auf Unit 2: Ziel-HP 40 → 31, Schaden 9, nicht tödlich.", () => {
    const forecast = previewAction(afterMove(), attack);

    expect(forecast).toEqual({
      targetId: 2,
      targetHpBefore: 40,
      targetHpAfter: 31,
      damage: 9,
      lethal: false,
    });
  });

  it("Hat Unit 2 in derselben Lage nur noch 9 HP, lautet der Forecast 9 → 0, Schaden 9, tödlich.", () => {
    const forecast = previewAction(afterMove(9), attack);

    expect(forecast).toEqual({
      targetId: 2,
      targetHpBefore: 9,
      targetHpAfter: 0,
      damage: 9,
      lethal: true,
    });
  });

  it("Für ein ungültiges Ziel (§9) liefert der Forecast kein Ergebnis und wirft keinen Fehler.", () => {
    // Ohne MOVE: Distanz 8 bei Reichweite 2–4.
    const outOfRange = createGreyboxLevel();
    // Unit 8 ist verbündet, kein ENEMY-Ziel.
    const ally = { type: "BASIC_ATTACK", attackerId: 7, targetId: 8 };
    // Unit 99 ist nicht im Spielzustand.
    const missing = { type: "BASIC_ATTACK", attackerId: 7, targetId: 99 };

    expect(() => previewAction(outOfRange, attack)).not.toThrow();
    expect(previewAction(outOfRange, attack)).toBeNull();
    expect(
      previewAction(
        afterMove(),
        /** @type {import("../src/resolve-action.js").Action} */ (ally),
      ),
    ).toBeNull();
    expect(
      previewAction(
        afterMove(),
        /** @type {import("../src/resolve-action.js").Action} */ (missing),
      ),
    ).toBeNull();
  });

  it("Der übergebene Spielzustand ist nach dem Aufruf unverändert.", () => {
    const state = afterMove(9);
    const before = structuredClone(state);

    previewAction(state, attack);

    expect(state).toEqual(before);
  });

  it("Schaden und Tod stimmen mit dem Ergebnis von `resolveAction` für dieselbe Aktion überein.", () => {
    for (const state of [afterMove(), afterMove(9)]) {
      const forecast = previewAction(state, attack);
      const result = resolveAction(state, attack);
      const defeated = !result.state.units.some(({ id }) => id === 2);

      expect(result.accepted).toBe(true);
      expect(forecast?.damage).toBe(result.damage);
      expect(forecast?.lethal).toBe(defeated);
    }
  });
});
