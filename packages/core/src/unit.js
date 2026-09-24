import templates from "../data/unit-templates.json" with { type: "json" };

/**
 * @typedef {"SELF" | "ALLY" | "ENEMY" | "TILE"} TargetType
 * @typedef {"SINGLE" | "RADIUS_1" | "LINE"} AreaType
 * @typedef {"PHYSICAL" | "MAGIC"} DamageType
 * @typedef {"player" | "enemy"} Team
 */

/**
 * §7
 * @typedef {object} Stats
 * @property {number} hp
 * @property {number} atk
 * @property {number} def
 * @property {number} mag
 * @property {number} res
 * @property {number} spd
 * @property {number} mov
 */

/**
 * @typedef {object} BasicAttack
 * @property {TargetType} target
 * @property {number} minRange
 * @property {number} maxRange
 * @property {DamageType} damageType
 * @property {number} multiplier
 * @property {AreaType} area
 */

/**
 * @typedef {object} Skill
 * @property {string} name
 * @property {TargetType} target
 * @property {number} minRange
 * @property {number} maxRange
 * @property {AreaType} area
 * @property {number} cooldown
 * @property {DamageType} [damageType]
 * @property {number} [multiplier]
 * @property {number} [healMultiplier]
 * @property {boolean} [friendlyFire]
 */

/**
 * §20, §21
 * @typedef {object} UnitTemplate
 * @property {string} id
 * @property {string} name
 * @property {Team} faction
 * @property {Stats} stats
 * @property {BasicAttack} basicAttack
 * @property {Skill[]} skills
 * @property {string | null} passive
 */

/**
 * @typedef {object} Unit
 * @property {number} id Unit-ID ab 1 in Spawn-Reihenfolge (§5.1).
 * @property {Team} team
 * @property {string} templateId
 * @property {import("./grid.js").Position} position
 * @property {number} hp Aktuelle Trefferpunkte (§7).
 * @property {number} maxHp HP-Wert der Vorlage, im Kampf fest (§7).
 * @property {Omit<Stats, "hp">} stats Übrige Basiswerte; HP führen `hp` und `maxHp`.
 */

/**
 * Lädt die Einheitenvorlagen aus `packages/core/data`. Liefert eine Kopie.
 *
 * @returns {UnitTemplate[]}
 */
export function loadUnitTemplates() {
  return structuredClone(/** @type {UnitTemplate[]} */ (templates));
}

/**
 * @param {UnitTemplate} template
 * @param {{ id: number, team: Team, position: import("./grid.js").Position }} init
 * @returns {Unit}
 */
export function createUnit(template, { id, team, position }) {
  if (!Number.isInteger(id) || id < 1) {
    throw new TypeError(
      "createUnit: Unit-ID muss eine Ganzzahl ab 1 sein (§5.1)",
    );
  }

  const { hp: maxHp, ...stats } = template.stats;

  return {
    id,
    team,
    templateId: template.id,
    position: { x: position.x, y: position.y },
    // §7: Zu Kampfbeginn gilt HP = MaxHP.
    hp: maxHp,
    maxHp,
    stats,
  };
}
