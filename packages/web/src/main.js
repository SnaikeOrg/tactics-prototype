import { createGreyboxLevel } from "@tactics/core";
import {
  applyControlInput,
  createAttackView,
  createBoardView,
  createControlView,
  startPlayerControl,
} from "./index.js";

/**
 * Zeichnet Steuerleiste und Raster und verbindet Klicks mit der
 * Steuerungsfunktion.
 *
 * @param {HTMLElement} root
 * @param {import("./player-control.js").PlayerControl} control
 */
function render(root, control) {
  const view = createBoardView(control.combat.state);
  const controlView = createControlView(control);
  const attackView = createAttackView(control);
  const targets = new Set(attackView.targetIds);
  const recent = new Set(controlView.recentUnitIds);
  const decided = controlView.result !== null;
  const movable = new Set(
    controlView.movableTiles.map(({ x, y }) => `${x},${y}`),
  );

  /** @param {import("./player-control.js").ControlInput} input */
  const send = (input) => render(root, applyControlInput(control, input));

  const hud = document.createElement("div");
  hud.className = "hud";
  const roundLine = document.createElement("span");
  roundLine.textContent = `Runde ${controlView.round}`;
  const orderLine = document.createElement("span");
  orderLine.className = "initiative";
  for (const unitId of controlView.initiativeOrder) {
    const entry = document.createElement("span");
    entry.textContent = String(unitId);
    if (unitId === controlView.activeUnitId) {
      entry.className = "initiative-active";
    }
    orderLine.append(entry);
  }
  const waitButton = document.createElement("button");
  waitButton.type = "button";
  waitButton.textContent = "Warten";
  waitButton.disabled = controlView.activeUnitId === null;
  waitButton.addEventListener("click", () => send({ type: "WAIT" }));
  const restartButton = document.createElement("button");
  restartButton.type = "button";
  restartButton.textContent = "Neu starten";
  restartButton.addEventListener("click", () => send({ type: "RESTART" }));
  hud.append(roundLine, "Initiative:", orderLine, waitButton, restartButton);
  if (controlView.result !== null) {
    const result = document.createElement("strong");
    result.className = "result";
    result.textContent = controlView.result;
    hud.append(result);
  }

  const panel = document.createElement("div");
  panel.className = "forecast";
  const { forecast } = attackView;
  if (forecast) {
    waitButton.disabled = true;
    const title = document.createElement("strong");
    title.textContent = `Basic Attack → Unit ${forecast.targetId}`;
    const hpLine = document.createElement("span");
    hpLine.textContent = `Target HP ${forecast.targetHpBefore} → ${forecast.targetHpAfter}`;
    const damageLine = document.createElement("span");
    damageLine.textContent = `Damage ${forecast.damage}`;
    panel.append(title, hpLine, damageLine);
    if (forecast.lethal) {
      const lethal = document.createElement("span");
      lethal.className = "forecast-lethal";
      lethal.textContent = "LETHAL";
      panel.append(lethal);
    }
    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.textContent = "Bestätigen";
    confirmButton.addEventListener("click", () => send({ type: "CONFIRM" }));
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Abbrechen";
    cancelButton.addEventListener("click", () => send({ type: "CANCEL" }));
    panel.append(confirmButton, cancelButton);
  } else {
    panel.hidden = true;
  }

  const board = document.createElement("div");
  board.className = "board";
  board.style.gridTemplateColumns = `repeat(${view.columns}, var(--tile-size))`;

  for (const tile of view.tiles) {
    const cell = document.createElement("div");
    cell.className = `tile terrain-${tile.terrainType.toLowerCase().replace("_", "-")}`;
    cell.title = `(${tile.x},${tile.y}) ${tile.terrain}`;
    if (movable.has(`${tile.x},${tile.y}`)) {
      cell.classList.add("tile-movable");
    }
    const position = { x: tile.x, y: tile.y };
    // §24: Nach Sieg oder Niederlage nimmt das Feld keine Eingaben mehr an.
    if (!decided) {
      cell.addEventListener("click", () =>
        send({ type: "CLICK_TILE", position }),
      );
    }

    const terrain = document.createElement("span");
    terrain.className = "terrain";
    terrain.textContent = tile.terrain;
    cell.append(terrain);

    if (tile.unit) {
      const { id, className, team, isPlayer, hp, maxHp } = tile.unit;
      const unit = document.createElement("div");
      unit.className = `unit ${isPlayer ? "unit-player" : "unit-enemy"}`;
      if (id === controlView.activeUnitId) {
        unit.classList.add("unit-active");
      }
      if (recent.has(id)) {
        unit.classList.add("unit-recent");
      }
      if (targets.has(id)) {
        cell.classList.add("tile-target");
      }

      const name = document.createElement("strong");
      name.textContent = `${id} ${className}`;
      const teamLine = document.createElement("span");
      teamLine.textContent = team;
      const hpLine = document.createElement("span");
      hpLine.textContent = `${hp}/${maxHp} HP`;

      unit.append(name, teamLine, hpLine);
      cell.append(unit);
    }

    board.append(cell);
  }

  const log = document.createElement("ol");
  log.className = "log";
  for (const entry of control.log) {
    const line = document.createElement("li");
    const move = `(${entry.from.x},${entry.from.y}) → (${entry.to.x},${entry.to.y})`;
    const action =
      entry.action.type === "BASIC_ATTACK"
        ? `BASIC_ATTACK → Unit ${entry.action.targetId}, Schaden ${entry.action.damage}, Ziel-HP ${entry.targetHp}`
        : "WAIT";
    line.textContent = `Runde ${entry.round} · Unit ${entry.unitId} · ${move} · ${action}`;
    log.append(line);
  }

  const layout = document.createElement("div");
  layout.className = "layout";
  layout.append(board, log);
  root.replaceChildren(hud, panel, layout);
}

const root = document.getElementById("app");

if (root) {
  render(root, startPlayerControl(createGreyboxLevel()));
}
