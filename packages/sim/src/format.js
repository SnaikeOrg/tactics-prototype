/**
 * @param {import("../../core/src/grid.js").Position} position
 * @returns {string}
 */
function tile({ x, y }) {
  return `(${x},${y})`;
}

/**
 * Gibt einen Kampflauf als lesbaren Text aus, eine Zeile pro Aktivierung und
 * am Ende das Ergebnis.
 *
 * @param {import("./combat.js").CombatRun} run
 * @returns {string}
 */
export function formatCombat(run) {
  const lines = run.log.map((entry) => {
    const move =
      entry.from.x === entry.to.x && entry.from.y === entry.to.y
        ? `bleibt auf ${tile(entry.from)}`
        : `${tile(entry.from)} -> ${tile(entry.to)}`;
    const action =
      entry.action.type === "BASIC_ATTACK"
        ? `BASIC_ATTACK auf Unit ${entry.action.targetId}, ${entry.action.damage} Schaden, Ziel-HP ${entry.targetHp}${(entry.targetHp ?? 1) <= 0 ? " (besiegt)" : ""}`
        : "WAIT";
    return `Runde ${entry.round} | Unit ${entry.unitId} | ${move} | ${action}`;
  });
  lines.push(
    `Ergebnis: ${run.result} nach ${run.rounds} ${run.rounds === 1 ? "Runde" : "Runden"}`,
  );
  return lines.join("\n");
}
