var attackBadges = 1;
var defenseBadges = 7;
var specialBadges = 6;
var speedBadges = 3;
var badgeTypes = new Map([
	["flying", 1],
	["bug", 2],
	["normal", 3],
	["ghost", 4],
	["fighting", 5],
	["ice", 6],
	["steel", 7],
	["dragon", 8],
	["electric", 9],
	["psychic", 10],
	["poison", 11],
	["grass", 12],
	["rock", 13],
	["water", 14],
	["fire", 15],
	["ground", 16],
]);
var specialTypes = new Set([
	"fire", "water", "electric", "grass", "ice", "psychic", "dragon", "dark"
]);

class EngineImpl extends Engine {

	getDamage(attacker, defender, move) {
		return getDamage(attacker, defender, move);
	}

	createBattlePoke() {
		return new BattlePokeImpl();
	}

	createBattleMove() {
		return new BattleMoveImpl();
	}
}

class BattlePokeImpl extends BattlePoke {

	getEffectiveStat(stat) {
		var v = getModifiedStat(this.poke, this.stages, stat);
		if (stat == "spe") {
			if (this.hasBadgeBoost() && badges >= speedBadges) {
				v = parseInt(v * 1.125);
			}
			if (this.status == "prz") {
				v = parseInt(v / 4);
			}
		}
		return v;
	}
}

class BattleMoveImpl extends BattleMove {

	get type() {
		if (this.move.name == "hidden-power") {
			var hp = getHiddenPower(this.user.poke);
			return hp.type;
		} else if (this.move.name == "future-sight") {
			return "curse";
		}
		return super.type;
	}

	get power() {
		if (this.move.name == "hidden-power") {
			var hp = getHiddenPower(this.user.poke);
			return hp.power;
		} else if (this.move.name == "flail" || this.move.name == "reversal") {
			var mhp = this.user.getStat("hp");
			var chp = this.user.currentHp;
			var ratio = chp / mhp;
			if (ratio < 0.0417) {
				return 200;
			} else if (ratio < 0.1042) {
				return 150;
			} else if (ratio < 0.2083) {
				return 100;
			} else if (ratio < 0.3542) {
				return 80;
			} else if (ratio < 0.6875) {
				return 40;
			} else {
				return 20;
			}
		}
		return super.power;
	}

	get category() {
		if (this.power == 0) {
			return "status";
		} else if (specialTypes.has(this.type)) {
			return "special";
		} else {
			return "physical";
		}
	}
}

engine = new EngineImpl();


/**
 * @param {BattlePoke} attacker
 * @param {BattlePoke} defender
 * @param {BattleMove} move
 * @return {CalcResult}
 */
function getDamage(attacker, defender, move) {
	if (defender.poke == undefined || move.category == "status" || move.power == 0) {
		return CalcResult.of(0);
	}
	var effects = BattleEffects.of(attacker, defender, move);

	var v = parseInt(attacker.level * 2 / 5) + 2;
	v *= move.power;

	special = move.category == "special";
	var attackStat = !special ? "atk" : "spa";
	var defenseStat = !special ? "def" : "spd";

	var a = getModifiedStat(attacker.poke, attacker.stages, attackStat);
	var d = getModifiedStat(defender.poke, defender.stages, defenseStat);
	var ignoreBoosts = false;
	if (move.crit && defender.stages[defenseStat] >= attacker.stages[attackStat]) {
		ignoreBoosts = true;
		a = attacker.getStat(attackStat);
		d = defender.getStat(defenseStat);
	}

	if (!ignoreBoosts) {
		// Badge boost
		if (attacker.hasBadgeBoost()) {
			if (!special && badges >= attackBadges) {
				a = parseInt(a * 1.125);
			} else if (special && badges >= specialBadges) {
				a = parseInt(a * 1.125);
			}
		}
		if (defender.hasBadgeBoost()) {
			if (!special && badges >= defenseBadges) {
				d = parseInt(d * 1.125);
			} else if (special && badges >= specialBadges) {
				d = parseInt(d * 1.125);
			}
		}
		// Burn
		if (!special && attacker.status == "brn") {
			a = (parseInt(a / 2));
		}
		// Screens
		if (special && defender.hasScreen("light-screen")) {
			d *= 2;
		} else if (!special && defender.hasScreen("reflect")) {
			d *= 2;
		}
	}

	a = effects.getModifier(attacker, defender, move, "attack-boost", a, 999);
	d = effects.getModifier(attacker, defender, move, "defense-boost", d, 999);

	// Gen 2 passes modified stats as ratios in 8 bit registers
	// If either exceeds 255, both are divided by 4 to fit
	if (a > 255 || d > 255) {
		a = parseInt(a / 4);
		d = parseInt(d / 4);
	}
	a = a & 0xFF;
	d = d & 0xFF;

	if (move.name == "explosion" || move.name == "selfdestruct") {
		d = Math.max(1, parseInt(d / 2));
	}

	v = parseInt(parseInt(v * a) / d);

	v = parseInt(v / 50);

	// Item boost
	v = effects.getModifier(attacker, defender, move, "item-boost", v, v);

	if (move.crit) {
		v *= 2;
	}
	v += 2;

	var weather = document.getElementById("current-weather").value;
	if (weather == "rain") {
		if (move.type == "fire" || move.name == "solar-beam") {
			v = parseInt(v * 0.5);
		} else if (move.type == "water") {
			v = parseInt(v * 1.5);
		}
	} else if (weather == "sun") {
		if (move.type == "water") {
			v = parseInt(v * 0.5);
		} else if (move.type == "fire") {
			v = parseInt(v * 1.5);
		}
	}

	if (attacker.isPlayer() && badgeTypes.has(move.type) && badgeTypes.get(move.type) <= badges) {
		v = parseInt(v * 1.125);
	}

	var ap = attacker.mon;
	var dp = defender.mon;
	// STAB
	if (move.name != "struggle" && contains(ap.types, move.type)) {
		v = parseInt(v * 1.5);
	}

	var eff = 1;
	eff *= getMatchup(move.type, dp.types[0]);
	if (dp.types.length > 1) {
		eff *= getMatchup(move.type, dp.types[1]);
	}
	if (eff == 0) {
		return CalcResult.of(0);
	}
	v = parseInt(v * eff);

	if (move.name == "dragon-rage") {
		return CalcResult.of(40);
	} else if (move.name == "sonicboom") {
		return CalcResult.of(20);
	} if (move.name == "seismic-toss" || move.name == "night-shade" || move.name == "psywave") {
		return CalcResult.of(attacker.level);
	}
	// Unhandled special move
	if (move.power == 1) {
		return CalcResult.of(-1);
	}
	v = effects.getModifier(attacker, defender, move, "damage", v, v);

	var rolls = [];
	for (var i = 217; i <= 255; i++) {
		rolls.push(Math.max(1, parseInt(v * i / 255)));
	}
	var hits = effects.getModifier(attacker, defender, move, "hits", 1, 1);
	var min = rolls[0] * hits;
	var max = rolls[rolls.length - 1] * hits;
	// TODO make nicer
	if (move.name == "triple-kick") {
		min = min * 6;
		max = max * 6;
	}
	var result = new CalcResult(rolls, min, max);
	var drain = effects.getModifierFloat(attacker, defender, move, "drain", 1, 1, 0);
	if (drain != 0) {
		result.drain = drain;
	}
	var recoil = effects.getModifierFloat(attacker, defender, move, "recoil", 1, 1, 0);
	if (recoil != 0) {
		result.recoil = recoil;
	}
	return result;
}

function getModifiedStat(poke, stages, stat) {
	var base = getPokeStat(poke, stat);
	var stage = stages[stat];
	var modifiers = [25, 28, 33, 40, 50, 66, 100, 150, 200, 250, 300, 350, 400];
	return parseInt(base * modifiers[stage + 6] / 100);
}

if (game.name == "ck+xp") {
	attackBadges = 99;
	defenseBadges = 99;
	specialBadges = 99;
	speedBadges = 99;
	badgeTypes = new Map([
		["dragon", 1],
		["water", 2],
		["fighting", 3],
		["ice", 4],
	]);
} else {
	attackBadges = 1;
	defenseBadges = 7;
	specialBadges = 6;
	speedBadges = 3;
	badgeTypes = new Map([
		["flying", 1],
		["bug", 2],
		["normal", 3],
		["ghost", 4],
		["fighting", 5],
		["ice", 6],
		["steel", 7],
		["dragon", 8],
		["electric", 9],
		["psychic", 10],
		["poison", 11],
		["grass", 12],
		["rock", 13],
		["water", 14],
		["fire", 15],
		["ground", 16],
	]);
}
