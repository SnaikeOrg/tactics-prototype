import { createRng, pick } from "@tactics/core";

/**
 * Renderer entry. All chance comes from core's injected, seedable RNG.
 *
 * @param {number} seed
 * @param {readonly string[]} items
 * @returns {string}
 */
export function renderChoice(seed, items) {
  return pick(createRng(seed), items);
}

export { createBoardView } from "./board-view.js";
