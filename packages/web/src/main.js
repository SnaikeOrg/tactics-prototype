import { createGreyboxLevel } from "@tactics/core";
import {
  applyControlInput,
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
  hud.append(roundLine, "Initiative:", orderLine, waitButton);

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
    cell.addEventListener("click", () =>
      send({ type: "CLICK_TILE", position }),
    );

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

  root.replaceChildren(hud, board);
}

const root = document.getElementById("app");

if (root) {
  render(root, startPlayerControl(createGreyboxLevel()));
}
