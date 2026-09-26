import { formatCombat, runCombat } from "./index.js";

/** Simulationsparameter, keine Balancing-Zahl (siehe docs/DECISIONS.md). */
const ROUND_LIMIT = 50;

console.log(formatCombat(runCombat({ roundLimit: ROUND_LIMIT })));
