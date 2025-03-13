class BattleEffects {
	effects;

	constructor(effects) {
		this.effects = effects;
	}

	/**
	 * @param {BattlePoke} attacker
	 * @param {BattlePoke} defender
	 * @param {BattleMove} move
	 * @returns {BattleEffects}
	 */
	static of(attacker, defender, move) {
		var addIfValid = function(effects, effect) {
			if (effect != null) {
				effects.push(effect);
			}
		}
		var effects = [];
		if (move.effects) {
			if (Array.isArray(move.effects)) {
				for (const v of move.effects) {
					addIfValid(effects, BattleEffect.parse("attack", v));
				}
			} else {
				addIfValid(effects, BattleEffect.parse("attack", move.effects));
			}
		}
		if (itemsByName.has(attacker.item)) {
			var ai = itemsByName.get(attacker.item);
			if (ai.effects) {
				if (Array.isArray(ai.effects.attack)) {
					for (const v of ai.effects.attack) {
						addIfValid(effects, BattleEffect.parse("attack", v));
					}
				} else {
					addIfValid(effects, BattleEffect.parse("attack", ai.effects.attack));
				}
			}
		}
		if (itemsByName.has(defender.item)) {
			var ai = itemsByName.get(defender.item);
			if (ai.effects) {
				if (Array.isArray(ai.effects.defend)) {
					for (const v of ai.effects.defend) {
						addIfValid(effects, BattleEffect.parse("defend", v));
					}
				} else {
					addIfValid(effects, BattleEffect.parse("defend", ai.effects.defend));
				}
			}
		}
		return new BattleEffects(effects);
	}

	/**
	 * @param {BattlePoke} attacker
	 * @param {BattlePoke} defender
	 * @param {BattleMove} move
	 * @param {String} modifier
	 * @param {Number} base
	 * @param {Number} max
	 * @returns {Number}
	 */
	getModifier(attacker, defender, move, modifier, base, max) {
		var result = base;
		for (const e of this.effects) {
			var mod = e.getModifier(attacker, defender, move, modifier);
			if (mod != null) {
				result = parseInt(mod(result, base, max));
			}
		}
		return result;
	}

	/**
	 * @param {BattlePoke} attacker
	 * @param {BattlePoke} defender
	 * @param {BattleMove} move
	 * @param {String} modifier
	 * @param {Number} base
	 * @param {Number} max
	 * @returns {Number}
	 */
	getModifierFloat(attacker, defender, move, modifier, base, max, def = undefined) {
		var result = base;
		var modified = false;
		for (const e of this.effects) {
			var mod = e.getModifier(attacker, defender, move, modifier);
			if (mod != null) {
				result = mod(result, base, max);
				modified = true;
			}
		}
		if (!modified && def !== undefined) {
			return def;
		}
		return result;
	}
}

class BattleEffect {
	#type;
	#condition;
	#modifiers;

	constructor(type, condition, modifiers) {
		this.#type = type;
		this.#condition = condition;
		this.#modifiers = modifiers;
	}

	/**
	 * @param {String} type
	 * @param {Object} json
	 * @returns {BattleEffect}
	 */
	static parse(type, json) {
		if (json == null || json == undefined) {
			return null;
		}
		return new BattleEffect(type, Condition.parse(json.condition), BattleEffect.parseModifiers(json.modifiers));
	}

	static parseModifiers(json) {
		const recursive = function(map, obj, prefix) {
			for (const k of Object.keys(obj)) {
				const v = obj[k];
				if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
					recursive(map, v, prefix + k + ".");
				} else {
					map.set(prefix + k, Modifier.parse(v));
				}
			}
		}
		var map = new Map();
		recursive(map, json, "");
		return map;
	}

	/**
	 * @param {BattlePoke} attacker
	 * @param {BattlePoke} defender
	 * @param {BattleMove} move
	 * @param {String} modifier
	 * @returns {Modifier}
	 */
	getModifier(attacker, defender, move, modifier) {
		if (this.#modifiers.has(modifier) && this.#condition.checkConditions(attacker, defender, move)) {
			return this.#modifiers.get(modifier);
		}
		return null;
	}

	/**
	 * @returns {String} `attack` or `defend`
	 */
	get type() {
		return this.#type;
	}
}

class Modifier {

	/**
	 * @returns {Modifier}
	 */
	static of(i) {
		return (value, base, max) => i;
	}

	/**
	 * @returns {Modifier}
	 */
	static parse(v) {
		if (typeof v === "number") {
			return Modifier.of(v);
		} else if (typeof v === "string") {
			var m = v.match(/^(\+|\-|=)([0-9.]+)(%?)$/);
			var op = m[1];
			var number = parseFloat(m[2]);
			var percent = m[3];
			if (percent == "%") {
				number = (number / 100);
				switch (op) {
					case "+":
						return (value, base, max) => value + base * number;
					case "-":
						return (value, base, max) => value - base * number;
					case "=":
						return (value, base, max) => base * number;
				}
			} else {
				switch (op) {
					case "+":
						return (value, base, max) => value + number;
					case "-":
						return (value, base, max) => value - number;
					case "=":
						return (value, base, max) => number;
				}
			}
		}
		return null;
	}
}

const CONDITION_PREDICATES = new Map();

class Condition {

	constructor(json) {
		this.json = json;
	}

	/**
	 * @returns {Condition}
	 */
	static parse(json) {
		return new Condition(json);
	}

	/**
	 * @param {BattlePoke} attacker
	 * @param {BattlePoke} defender
	 * @param {BattleMove} move
	 * @returns {boolean}
	 */
	checkConditions(attacker, defender, move) {
		if (!this.json) {
			return true; // Unconditional
		}
		var checkCondition = this.checkCondition;
		var recursive = function(obj, key) {
			for (const k of Object.keys(obj)) {
				const v = obj[k];
				var ret = checkCondition(key + k, v, attacker, defender, move);
				if (ret === true) {
					continue;
				} else if (ret === undefined && typeof v === 'object' && !Array.isArray(v) && v !== null) {
					if (recursive(v, key + k + ".")) {
						continue;
					}
				}
				return false;
			}
			return true;
		}
		return recursive(this.json, "");
	}

	/**
	 * @param {String} name
	 * @param {Object} condition
	 * @param {BattlePoke} attacker
	 * @param {BattlePoke} defender
	 * @param {BattleMove} move
	 * @returns {boolean}
	 */
	checkCondition(name, condition, attacker, defender, move) {
		if (CONDITION_PREDICATES.has(name)) {
			return CONDITION_PREDICATES.get(name)(condition, attacker, defender, move);
		} else {
			return undefined;
		}
	}
}

function checkStringCondition(condition, value) {
	if (typeof condition === "string") {
		return condition == value;
	} else if (Array.isArray(condition)) {
		return condition.contains(value);
	}
	return false;
}

function checkNumberCondition(condition, value, max) {
	if (typeof condition === "number") {
		return condition == value;
	} else if (Array.isArray(condition)) {
		return condition.contains(value);
	} else if (typeof condition === "string") {
		var m = condition.match(/^(<|<=|>|>=|!=|=|==|)([0-9.]+)(%)$/);
		var op = m[1];
		var number = parseFloat(m[2]);
		var percent = m[3];
		if (percent == "%" && max !== undefined) {
			number = number * 100 / max;
		}
		switch (op) {
			case "==":
			case "=":
			case "":
				return value == number;
			case "!=":
				return value != number;
			case "<":
				return value < number;
			case "<=":
				return value <= number;
			case ">":
				return value > number;
			case ">=":
				return value >= number;
		}
		return false;
	}
	return false;
}

function checkBooleanCondition(condition, value) {
	return condition == value;
}

function initConditions() {
	CONDITION_PREDICATES.set("move.name", (condition, attacker, defender, move) => checkStringCondition(condition, move.name));
	CONDITION_PREDICATES.set("move.type", (condition, attacker, defender, move) => checkStringCondition(condition, move.type));
	CONDITION_PREDICATES.set("move.category", (condition, attacker, defender, move) => checkStringCondition(condition, move.category));
	CONDITION_PREDICATES.set("move.power", (condition, attacker, defender, move) => checkNumberCondition(condition, move.power));
	var addForBoth = function(name, lambda) {
		CONDITION_PREDICATES.set("attacker." + name, (condition, attacker, defender, move) => lambda(condition, attacker, defender, move));
		CONDITION_PREDICATES.set("defender." + name, (condition, attacker, defender, move) => lambda(condition, defender, attacker, move));
	}
	addForBoth("name", (condition, poke, opponent, move) => checkStringCondition(condition, poke.name));
	addForBoth("item", (condition, poke, opponent, move) => checkStringCondition(condition, poke.item));
	addForBoth("level", (condition, poke, opponent, move) => checkNumberCondition(condition, poke.level));
	addForBoth("transformed", (condition, poke, opponent, move) => checkBooleanCondition(condition, (poke.poke.transformStats != undefined)));
	addForBoth("hp", (condition, poke, opponent, move) => checkNumberCondition(condition, poke.currentHp(), poke.getStat("hp")));
	addForBoth("statused", (condition, poke, opponent, move) => checkBooleanCondition(condition, poke.status != ""));
	addForBoth("status", (condition, poke, opponent, move) => checkStringCondition(condition, poke.status));
}

initConditions();

