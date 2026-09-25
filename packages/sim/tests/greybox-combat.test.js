import { describe, expect, it } from "vitest";
import {
  applyTurnInput,
  beginActivation,
  combatStatus,
  createGreyboxLevel,
  nextActivation,
  resolveAction,
  startRound,
} from "@tactics/core";
import { requireAccepted, runCombat } from "../src/index.js";

/** Simulationsparameter der Tests, keine Balancing-Zahl. */
const ROUND_LIMIT = 50;

const REPO_ROOT = new URL("../../../", import.meta.url);

// Ohne @types/node: Node-Module über einen nicht-literalen Spezifizierer laden
// und nur die hier genutzte Signatur typisieren.
const NODE_FS = "node:fs";
const NODE_CHILD_PROCESS = "node:child_process";
const { readFileSync } =
  /** @type {{ readFileSync: (path: URL, encoding: "utf8") => string }} */ (
    await import(NODE_FS)
  );
const { execFileSync } =
  /** @type {{ execFileSync: (file: string, args: string[], options: { cwd: URL, encoding: "utf8" }) => string }} */ (
    await import(NODE_CHILD_PROCESS)
  );

/**
 * Spielt ein Log mit den Bausteinen aus `core` nach. Prüft dabei, dass jede
 * Aktivierung in der Reihenfolge von `nextActivation` kommt und jede Eingabe
 * akzeptiert wird.
 *
 * @param {ReturnType<typeof runCombat>["log"]} log
 * @returns {{ state: ReturnType<typeof createGreyboxLevel>, rounds: number }}
 */
function replay(log) {
  let state = createGreyboxLevel();
  let index = 0;
  let round = 0;

  while (index < log.length) {
    round += 1;
    let order = startRound(state);
    for (;;) {
      const activation = nextActivation(state, order);
      order = activation.round;
      if (activation.unitId === null || index >= log.length) {
        break;
      }
      const entry = log[index];
      index += 1;
      expect(entry?.round).toBe(round);
      expect(entry?.unitId).toBe(activation.unitId);
      if (!entry) {
        break;
      }

      const unit = state.units.find(({ id }) => id === entry.unitId);
      expect(entry.from).toEqual(unit?.position);

      let phase = beginActivation(entry.unitId);
      if (entry.to.x !== entry.from.x || entry.to.y !== entry.from.y) {
        const moved = applyTurnInput(state, phase, {
          type: "MOVE",
          to: entry.to,
        });
        expect(moved.accepted).toBe(true);
        state = moved.state;
        phase = moved.activation;
      }

      if (entry.action.type === "BASIC_ATTACK") {
        const acted = applyTurnInput(state, phase, { type: "ACTION" });
        expect(acted.accepted).toBe(true);
        const resolved = resolveAction(acted.state, {
          type: "BASIC_ATTACK",
          attackerId: entry.unitId,
          targetId: entry.action.targetId,
        });
        expect(resolved.accepted).toBe(true);
        state = resolved.state;
      } else {
        const waited = applyTurnInput(state, phase, { type: "WAIT" });
        expect(waited.accepted).toBe(true);
        state = waited.state;
      }
    }
  }

  return { state, rounds: round };
}

describe("runCombat (Greybox-Level, KI gegen KI)", () => {
  it("Die Simulation endet auf dem Greybox-Level mit `SIEG`, `NIEDERLAGE` oder `ABBRUCH` und gibt die Anzahl gespielter Runden zurück.", () => {
    const run = runCombat({ roundLimit: ROUND_LIMIT });

    expect(["SIEG", "NIEDERLAGE", "ABBRUCH"]).toContain(run.result);
    expect(Number.isInteger(run.rounds)).toBe(true);
    expect(run.rounds).toBeGreaterThanOrEqual(1);
    expect(run.rounds).toBeLessThanOrEqual(ROUND_LIMIT);
    expect(run.rounds).toBe(run.log.at(-1)?.round);
  });

  it("Endet der Kampf mit `SIEG` oder `NIEDERLAGE`, entspricht das `combatStatus` des Endzustands (§24).", () => {
    const run = runCombat({ roundLimit: ROUND_LIMIT });
    const expected = {
      SIEG: "victory",
      NIEDERLAGE: "defeat",
      ABBRUCH: "ongoing",
    };

    expect(combatStatus(run.state)).toBe(expected[run.result]);
    expect(combatStatus(replay(run.log).state)).toBe(expected[run.result]);
  });

  it("Jeder Log-Eintrag enthält Runde, Unit-ID, Standfeld vor und nach der Bewegung, die Aktion (`BASIC_ATTACK` mit Ziel-ID und Schaden, oder `WAIT`) sowie die HP des Ziels danach.", () => {
    const run = runCombat({ roundLimit: ROUND_LIMIT });
    /** @type {Map<number, number>} */
    const hp = new Map(createGreyboxLevel().units.map((u) => [u.id, u.hp]));

    expect(run.log.length).toBeGreaterThan(0);
    expect(run.log.some(({ action }) => action.type === "BASIC_ATTACK")).toBe(
      true,
    );
    for (const entry of run.log) {
      expect(Number.isInteger(entry.round)).toBe(true);
      expect(hp.has(entry.unitId)).toBe(true);
      expect(entry.from).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
      });
      expect(entry.to).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
      });
      if (entry.action.type === "BASIC_ATTACK") {
        const before = hp.get(entry.action.targetId);
        expect(before).toBeDefined();
        expect(entry.action.damage).toBeGreaterThan(0);
        expect(entry.targetHp).toBe((before ?? 0) - entry.action.damage);
        hp.set(entry.action.targetId, entry.targetHp ?? 0);
      } else {
        expect(entry.action).toEqual({ type: "WAIT" });
        expect(entry.targetHp).toBeNull();
      }
    }
  });

  it("Innerhalb einer Runde aktivieren die Einheiten in der Reihenfolge von `nextActivation` (§5, §5.1). Besiegte Einheiten tauchen im Log nach ihrem Tod nicht mehr auf (§18).", () => {
    const run = runCombat({ roundLimit: ROUND_LIMIT });

    const { rounds } = replay(run.log);
    expect(rounds).toBe(run.rounds);

    /** @type {Set<number>} */
    const defeated = new Set();
    for (const entry of run.log) {
      expect(defeated.has(entry.unitId)).toBe(false);
      if (entry.action.type === "BASIC_ATTACK") {
        expect(defeated.has(entry.action.targetId)).toBe(false);
        if ((entry.targetHp ?? 1) <= 0) {
          defeated.add(entry.action.targetId);
        }
      }
    }
    expect(defeated.size).toBeGreaterThan(0);
  });

  it("Jede Aktivierung umfasst höchstens eine Bewegung und höchstens eine Aktion (§6). Alle Eingaben werden von `applyTurnInput` bzw. `resolveAction` akzeptiert. Eine abgelehnte Eingabe bricht die Simulation mit einem Fehler ab.", () => {
    const run = runCombat({ roundLimit: ROUND_LIMIT });

    for (const entry of run.log) {
      expect(Object.keys(entry).sort()).toEqual(
        ["action", "from", "round", "targetHp", "to", "unitId"].sort(),
      );
    }
    // replay() wendet je Aktivierung höchstens ein MOVE und genau eine
    // ACTION oder WAIT an und erwartet, dass jede Eingabe akzeptiert wird.
    replay(run.log);

    const accepted = { accepted: true };
    expect(requireAccepted(accepted, "MOVE")).toBe(accepted);
    expect(() => requireAccepted({ accepted: false }, "MOVE")).toThrow(/MOVE/);
  });

  it("Zwei Läufe mit gleichen Parametern liefern identische Logs, denn §5.1 und §23.1 verwenden keinen Zufall.", () => {
    const first = runCombat({ roundLimit: ROUND_LIMIT });
    const second = runCombat({ roundLimit: ROUND_LIMIT });

    expect(second.log).toEqual(first.log);
    expect(second.result).toBe(first.result);
    expect(second.rounds).toBe(first.rounds);
  });

  it("Bei Rundenlimit 1 endet der Kampf nach genau einer Runde mit `ABBRUCH`, sofern er nicht schon vorher entschieden ist.", () => {
    const run = runCombat({ roundLimit: 1 });

    expect(run.rounds).toBe(1);
    expect(combatStatus(run.state)).toBe("ongoing");
    expect(run.result).toBe("ABBRUCH");
    expect(run.log.every(({ round }) => round === 1)).toBe(true);
    expect(run.log.length).toBe(createGreyboxLevel().units.length);
  });

  it("Ein Befehl vom Repo-Root (z. B. `pnpm sim`) gibt das Log und das Ergebnis lesbar auf der Konsole aus.", () => {
    const output = execFileSync("pnpm", ["--silent", "sim"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    const lines = output.trim().split("\n");

    expect(lines.at(-1)).toMatch(
      /^Ergebnis: (SIEG|NIEDERLAGE|ABBRUCH) nach \d+ Runden?$/,
    );
    expect(lines[0]).toMatch(/^Runde 1 /);
    expect(
      lines
        .slice(0, -1)
        .every((/** @type {string} */ line) => line.startsWith("Runde ")),
    ).toBe(true);
  });

  it("Die beiden Annahmen stehen als je eine Zeile in `docs/DECISIONS.md`.", () => {
    const lines = readFileSync(
      new URL("docs/DECISIONS.md", REPO_ROOT),
      "utf8",
    ).split("\n");

    expect(
      lines.filter(
        (/** @type {string} */ line) =>
          line.startsWith("- ") &&
          line.includes("Spielerfiguren") &&
          line.includes("Aggressive") &&
          line.includes("Simulation"),
      ),
    ).toHaveLength(1);
    expect(
      lines.filter(
        (/** @type {string} */ line) =>
          line.startsWith("- ") &&
          line.includes("Rundenlimit") &&
          line.includes("ABBRUCH"),
      ),
    ).toHaveLength(1);
  });
});
