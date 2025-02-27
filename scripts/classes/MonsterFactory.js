import Dice from "./Dice.js";
import MonsterHelpers from "./MonsterHelpers.js";
import { DEFAULT_ABILITIES } from "../consts/DefaultAbilities.js";
import { DEFAULT_LANGUAGES } from "../consts/DefaultLanguages.js";
import { DEFAULT_DAMAGE_TYPES } from "../consts/DefaultDamageTypes.js";
import { DEFAULT_CONDITIONS } from "../consts/DefaultConditions.js";
import { DEFAULT_SKILLS } from "../consts/DefaultSkills.js";
import { DEFAULT_SPEEDS } from "../consts/DefaultSpeeds.js";
import { DEFAULT_SENSES } from "../consts/DefaultSenses.js";
import DerivedAttribute from "./DerivedAttribute.js";

const MonsterFactory = (function() {

	function createEntity(blueprint) {
		const derivedAttributes = MonsterHelpers.getDerivedAttributes(
			blueprint.data.combat.level,
			blueprint.data.combat.rank,
			blueprint.data.combat.role
		);
		const monsterProficiency = _parseProficiency(derivedAttributes, blueprint.data.proficiency_bonus);
		const monsterAbilityModifiers = _parseAbilityModifiers(derivedAttributes, blueprint.data.ability_modifiers);
		const monsterSkills = _parseSkills(monsterProficiency.getValue(), monsterAbilityModifiers, blueprint.data.skills);
		
		return {
			vid: blueprint.vid,
			type: blueprint.type,
			data: {
				name: _parseName(blueprint.data.description.name),
				image: blueprint.data.description.image,
				description: _parseDescription(blueprint.data.description),
				level: _parseLevel(derivedAttributes.level),
				rank: _parseRank(derivedAttributes.rank),
				phase: _parsePhase(derivedAttributes.rank),
				role: _parseRole(derivedAttributes.role),
				hit_points: _parseHitPoints(derivedAttributes, blueprint.data.hit_points),
				armor_class: _parseArmorClass(derivedAttributes, blueprint.data.armor_class),
				attack_bonus: _parseAttackBonus(derivedAttributes, blueprint.data.attack_bonus),
				attack_dcs: _parseAttackDcs(derivedAttributes, blueprint.data.attack_dcs),
				damage_per_action: _parseDamagePerAction(derivedAttributes, blueprint.data.damage_per_action),
				ability_modifiers: monsterAbilityModifiers,
				saving_throws: _parseSavingThrows(derivedAttributes, blueprint.data.saving_throws),
				proficiency_bonus: monsterProficiency,
				skills: monsterSkills,
				speeds: _parseSpeeds(blueprint.data.speeds),
				senses: _parseSenses(blueprint.data.senses),
				passive_perception: _parsePassivePerception(monsterSkills, monsterAbilityModifiers, blueprint.data.passive_perception),
				languages: _parseCollection(DEFAULT_LANGUAGES, blueprint.data.languages, "languages"),
				damage_immunities: _parseCollection(DEFAULT_DAMAGE_TYPES, blueprint.data.damage_immunities, "damage"),
				damage_resistances: _parseCollection(DEFAULT_DAMAGE_TYPES, blueprint.data.damage_resistances, "damage"),
				damage_vulnerabilities: _parseCollection(DEFAULT_DAMAGE_TYPES, blueprint.data.damage_vulnerabilities, "damage"),
				condition_immunities: _parseCollection(DEFAULT_CONDITIONS, blueprint.data.condition_immunities, "condition"),
				xp: _parseXp(derivedAttributes, blueprint.data.xp),
				challenge_rating: _parseChallengeRating(derivedAttributes, blueprint.data.challenge_rating)
			}
		};
	}

	function _parseName(name) {
		return (name && name.trim().length > 0) ? name.trim() : "???";
	}

	function _parseDescription(description) {
        const parts = [];
        parts.push(game.i18n.format(`gg5e_mm.monster.common.size.${description.size}`));
        if (description.type.category === "custom") {
            if (description.type.custom.trim().length > 0) {
                parts.push(description.type.custom);
            }
        } else {
            parts.push(game.i18n.format(`gg5e_mm.monster.common.type.${description.type.category}`).toLowerCase());
        }
        const tags = description.tags ? description.tags.split(",").map(x => x.trim()).filter(x => x.length > 0).sort() : "";
        if (tags.length > 0) {
            parts.push(`(${tags.join(", ")})`);
        }
		const alignment = game.i18n.format(`gg5e_mm.monster.common.alignment.${description.alignment}`).toLowerCase();
        return `${parts.join(' ')}, ${alignment}`;
    }
	
	function _parseLevel(level) {
        return game.i18n.format('gg5e_mm.monster.view.level', { level: level });
    }

    function _parseRank(rank) {
        let name = (rank.type == "custom") ? rank.custom_name : game.i18n.format(`gg5e_mm.monster.common.rank.${rank.type}`);
		if (!name || name.trim().length == 0 ) {
			name = "???";
		}
        if (rank.modifiers.scale_with_players && rank.modifiers.target_players != 1) {
            name = game.i18n.format(
				`gg5e_mm.monster.view.rank.vs`,
				{ name: name, players: rank.modifiers.target_players }
			);
		}
		return {
			name: name,
			threat: rank.modifiers.threat
        };
    }

	function _parsePhase(rank) {
        if (rank.modifiers.has_phases && rank.modifiers.phases.maximum > 1) {
            return game.i18n.format('gg5e_mm.monster.view.phase', rank.modifiers.phases);
        } else {
            return null;
        }
    }

    function _parseRole(role) {
		const name = (role.type == "custom") ? role.custom_name : game.i18n.format(`gg5e_mm.monster.common.role.${role.type}`);
        return {
            name: (!name || name.trim().length == 0 ) ? "???" : name,
            icon: role.modifiers.icon
        };
    }

	function _parseHitPoints(derivedAttributes, hitPoints) {
		const maximumHp = derivedAttributes.maximumHitPoints;
		maximumHp.applyModifier(hitPoints.maximum.modifier, hitPoints.maximum.override);
		maximumHp.setMinimumValue(1);

		return {
			current: Math.min(hitPoints.current, maximumHp.getValue()),
			temporary: Math.max(hitPoints.temporary, 0),
			maximum: maximumHp
		};
    }

	function _parseArmorClass(derivedAttributes, armorClass) {
		const ac = derivedAttributes.armorClass;
		ac.applyModifier(armorClass.modifier, armorClass.override);
		ac.setMinimumValue(1);

		return $.extend(ac, { type: armorClass.type });
    }

	function _parseAttackBonus(derivedAttributes, attackBonus) {
		const ab = derivedAttributes.attackBonus;
		ab.applyModifier(attackBonus.modifier, attackBonus.override);
		ab.setMinimumValue(1);

		return $.extend(ab, { type: attackBonus.type });
    }

	function _parseAttackDcs(derivedAttributes, attackDcs) {
        const dcs = derivedAttributes.attackDcs;
		dcs.primary.applyModifier(attackDcs.primary.modifier, attackDcs.primary.override);
		dcs.primary.setMinimumValue(0);
		dcs.secondary.applyModifier(attackDcs.secondary.modifier, attackDcs.secondary.override);
		dcs.secondary.setMinimumValue(0);

        return {
            primary: $.extend(dcs.primary, { type: attackDcs.primary.type }),
            secondary: $.extend(dcs.secondary, { type: attackDcs.secondary.type })
        };
    }

	function _parseDamagePerAction(derivedAttributes, damagePerAction) {
		const damage = derivedAttributes.damagePerAction;
		damage.applyModifier(damagePerAction.modifier, damagePerAction.override);
		damage.setMinimumValue(1);

		const dice = Dice.getDiceRoll(damage.value, damagePerAction.die_size, damagePerAction.maximum_dice);

        return $.extend(damage, {
			dice: dice ? dice : "—",
			type: damagePerAction.type
		});
    }

	function _parseAbilityModifiers(derivedAttributes, abilityModifiers) {
		const ams = {};
		DEFAULT_ABILITIES.forEach((x) => {
			let ranking = abilityModifiers.ranking.indexOf(x);
			ams[x] = derivedAttributes.abilityModifiers[ranking];
		});

		if (abilityModifiers.modifiers) {
			const modifiers = abilityModifiers.modifiers.split(",").map(x => x.split("="));
			modifiers.forEach(function(modifier) {
				const ability = modifier[0].trim().toLowerCase();
				const value = Number(modifier[1]);
				if (DEFAULT_ABILITIES.includes(ability)) {
					ams[ability].applyModifier(value, abilityModifiers.override);
				}
			});
		}

        return ams;
    }

	function _parseSavingThrows(derivedAttributes, savingThrows) {
		const sts = {};
		DEFAULT_ABILITIES.forEach((x) => {
			let ranking = savingThrows.ranking.indexOf(x);
			sts[x] = derivedAttributes.savingThrows[ranking];
		});

		if (savingThrows.modifiers) {
			const modifiers = savingThrows.modifiers.split(",").map(x => x.split("="));
			modifiers.forEach(function(modifier) {
				const ability = modifier[0].trim().toLowerCase();
				const value = Number(modifier[1]);
				if (DEFAULT_ABILITIES.includes(ability)) {
					sts[ability].applyModifier(value, savingThrows.override);
				}
			});
		}

        return sts;
    }

	function _parseProficiency(derivedAttributes, proficiencyBonus) {
		const prof = new DerivedAttribute();
		prof.setValue(derivedAttributes.averageProficiencyBonus);
		prof.addSource(derivedAttributes.averageProficiencyBonus, "base");
		prof.applyModifier(proficiencyBonus.modifier, proficiencyBonus.override);
		prof.setMinimumValue(1);

        return prof;
    }

	function _parseSkills(proficiencyBonus, abilityModifiers, monsterSkills) {
		let skills = [];
		DEFAULT_SKILLS.forEach(function(defaultSkill) {
			if (monsterSkills[defaultSkill.name]) {
				const baseModifier = abilityModifiers[defaultSkill.ability].getValue();
				let proficiencyModifier = 0;
				let proficiencyType = "";
				switch (monsterSkills[defaultSkill.name]) {
					case "half-proficient":
						proficiencyModifier = Math.floor(proficiencyBonus / 2);
						proficiencyType = "half-proficiency";
						break;
					case "proficient":
						proficiencyModifier = proficiencyBonus;
						proficiencyType = "proficiency";
						break;
					case "expert":
						proficiencyModifier = proficiencyBonus * 2;
						proficiencyType = "expertise";
						break;
				}

				const skill = new DerivedAttribute();
				skill.setValue(baseModifier + proficiencyModifier);
				skill.addSource(baseModifier, "ability modifier");
				skill.addSource(proficiencyModifier, proficiencyType);

				skills.push($.extend(skill, {
					code: defaultSkill.name,
					ability: defaultSkill.ability,
					title: game.i18n.format(`gg5e_mm.monster.common.skill.${defaultSkill.name}`)
				}));
			}
		});
		return skills;
	}

	function _parseSpeeds(monsterSpeeds) {
		const speeds = [];
		DEFAULT_SPEEDS.forEach(function(defaultSpeed) {
			if (monsterSpeeds[defaultSpeed]) {
				const speed = {};
				speed.title = game.i18n.format(`gg5e_mm.monster.common.speeds.${defaultSpeed}`);
				speed.value = monsterSpeeds[defaultSpeed];
				speed.unit = monsterSpeeds.unit;
				if (defaultSpeed == "fly" && monsterSpeeds.can_hover) {
					speed.detail =  game.i18n.format(`gg5e_mm.monster.common.speeds.can_hover`).toLowerCase();
				}

				speeds.push(speed);
			}
		});

		if (monsterSpeeds.other) {
			monsterSpeeds.other.split(",").map(x => x.split("=")).forEach((x) => {;
				speeds.push({
					title: x[0].trim().toLowerCase(),
					value: Number(x[1]) ? Number(x[1]) : null,
					unit: monsterSpeeds.unit
				});
			});
		}

		return speeds;
    }

	function _parseSenses(monsterSenses) {
		const senses = [];
		DEFAULT_SENSES.forEach(function(type) {
			if (monsterSenses[type]) {
				const sense = {};
				sense.title = game.i18n.format(`gg5e_mm.monster.common.senses.${type}`);
				sense.value = monsterSenses[type];
				sense.unit = monsterSenses.unit;
				senses.push(sense);
			}
		});

		if (monsterSenses.other) {
			monsterSenses.other.split(",").map(x => x.split("=")).forEach((x) => {
				senses.push({
					title: x[0].trim().toLowerCase(),
					value: Number(x[1]) ? Number(x[1]) : null,
					unit: monsterSenses.unit
				});
			});
		}

		return senses;
    }

	function _parsePassivePerception(skills, abilityModifiers, passivePerception) {
		const basePerc = 10;
		const percep = new DerivedAttribute();
		percep.setValue(basePerc);
		percep.addSource(basePerc, "base");

		if (skills.find((x) => x.code == "perception")) {
			const skillPerc = skills.find((x) => x.code == "perception").getValue();
			percep.addValue(skillPerc);
			percep.addSource(skillPerc, "perception");
		} else {
			const wisPerc = abilityModifiers["wis"].getValue();
			percep.addValue(wisPerc);
			percep.addSource(wisPerc, "WIS");
		}
		
		percep.applyModifier(passivePerception.modifier, passivePerception.override);
		percep.setMinimumValue(1);

        return percep;
    }

	function _parseCollection(collection, options, key) {
		let output = [];
		collection.forEach(function(type) {
			if (options[type]) {
				output.push(game.i18n.format(`gg5e_mm.monster.common.${key}.${type}`));
			}
		});

		if (options.other) {
			options.other.split(",").forEach((x) => output.push(x));
		}
		
		return output;
	}

	function _parseXp(derivedAttributes, xpModifier) {
		const xp = derivedAttributes.xp;
		xp.applyModifier(xpModifier.modifier, xpModifier.override);
		xp.setMinimumValue(0);

		return xp;
	}

	function _parseChallengeRating(derivedAttributes, crModifier) {
		const cr = derivedAttributes.challengeRating;
		cr.applyModifier(crModifier.modifier, crModifier.override);
		cr.setMinimumValue(0);

		return cr;
	}

	return {
		createEntity: createEntity
	};
})();

export default MonsterFactory;
