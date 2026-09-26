import { describe, expect, it } from "vitest";
import {
  applyDamage,
  createGreyboxLevel,
  endActivation,
  startCombat,
} from "../src/index.js";

/**
 * Entfernt eine Einheit über tödlichen Schaden aus dem Spielzustand (§18).
 *
 * @param {import("../src/game-state.js").GameState} state
 * @param {number} unitId
 */
function defeat(state, unitId) {
  const unit = state.units.find(({ id }) => id === unitId);
  if (!unit) {
    throw new Error(`Unit-ID ${unitId} fehlt`);
  }
  return applyDamage(state, unitId, unit.hp).state;
}

describe("Kampfablauf", () => {
  it("Nach dem Start des Greybox-Levels ist Runde 1 und Unit 7 aktiv.", () => {
    const combat = startCombat(createGreyboxLevel());

    expect(combat.round).toBe(1);
    expect(combat.activeUnitId).toBe(7);
  });

  it("Beendet man in Runde 1 jede Aktivierung ohne Eingabe, sind die Einheiten in der Reihenfolge 7, 3, 6, 2, 8, 4, 5, 1 aktiv. Danach ist Runde 2 und Unit 7 aktiv.", () => {
    let combat = startCombat(createGreyboxLevel());
    /** @type {(number | null)[]} */
    const active = [];

    while (combat.round === 1) {
      active.push(combat.activeUnitId);
      combat = endActivation(combat, combat.state);
    }

    expect(active).toEqual([7, 3, 6, 2, 8, 4, 5, 1]);
    expect(combat.round).toBe(2);
    expect(combat.activeUnitId).toBe(7);
  });

  it("Eine Einheit, die vor ihrer Aktivierung besiegt wurde, wird nie aktiv (§18).", () => {
    let combat = startCombat(createGreyboxLevel());
    // Unit 7 ist aktiv und besiegt Unit 3, die als Nächste dran wäre.
    combat = endActivation(combat, defeat(combat.state, 3));
    /** @type {(number | null)[]} */
    const active = [];

    while (combat.round <= 2) {
      active.push(combat.activeUnitId);
      combat = endActivation(combat, combat.state);
    }

    expect(active).not.toContain(3);
    expect(active).toEqual([6, 2, 8, 4, 5, 1, 7, 6, 2, 8, 4, 5, 1]);
  });

  it("Ist nach einer Aktivierung keine gegnerische Einheit mehr im Spielzustand, lautet der Status Sieg und keine Einheit ist aktiv. Ist keine Spielerfigur mehr im Spielzustand, lautet er Niederlage (§24).", () => {
    const combat = startCombat(createGreyboxLevel());
    const withoutEnemies = [5, 6, 7, 8].reduce(defeat, combat.state);
    const withoutPlayers = [1, 2, 3, 4].reduce(defeat, combat.state);

    const won = endActivation(combat, withoutEnemies);
    const lost = endActivation(combat, withoutPlayers);

    expect(won.status).toBe("victory");
    expect(won.activeUnitId).toBeNull();
    expect(lost.status).toBe("defeat");
    expect(lost.activeUnitId).toBeNull();
  });

  it("Der übergebene Kampf ist nach `endActivation` unverändert.", () => {
    let combat = startCombat(createGreyboxLevel());
    // Bis zur letzten Aktivierung von Runde 1, damit auch der Rundenwechsel
    // geprüft wird.
    while (combat.activeUnitId !== 1) {
      combat = endActivation(combat, combat.state);
    }
    const before = structuredClone(combat);

    endActivation(combat, defeat(combat.state, 7));

    expect(combat).toEqual(before);
  });
});
