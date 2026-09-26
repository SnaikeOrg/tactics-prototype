import { createGreyboxLevel } from "@tactics/core";
import { createBoardView } from "./index.js";

/**
 * Zeichnet das Anzeigemodell als HTML-Raster.
 *
 * @param {HTMLElement} root
 * @param {import("./board-view.js").BoardView} view
 */
function renderBoard(root, view) {
  const board = document.createElement("div");
  board.className = "board";
  board.style.gridTemplateColumns = `repeat(${view.columns}, var(--tile-size))`;

  for (const tile of view.tiles) {
    const cell = document.createElement("div");
    cell.className = `tile terrain-${tile.terrainType.toLowerCase().replace("_", "-")}`;
    cell.title = `(${tile.x},${tile.y}) ${tile.terrain}`;

    const terrain = document.createElement("span");
    terrain.className = "terrain";
    terrain.textContent = tile.terrain;
    cell.append(terrain);

    if (tile.unit) {
      const { id, className, team, isPlayer, hp, maxHp } = tile.unit;
      const unit = document.createElement("div");
      unit.className = `unit ${isPlayer ? "unit-player" : "unit-enemy"}`;

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

  root.replaceChildren(board);
}

const root = document.getElementById("app");

if (root) {
  renderBoard(root, createBoardView(createGreyboxLevel()));
}
