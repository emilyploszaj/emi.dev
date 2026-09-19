var specialTypes = new Set([
	"fire", "water", "electric", "grass", "ice", "psychic", "dragon", "dark"
]);

class EngineImpl extends Engine {

	getDamage(attacker, defender, move) {
		return getDamage(attacker, defender, move);
	}

	createBattlePoke() {
		return new BattlePokeGen3Impl();
	}

	createBattleMove() {
		return new BattleMoveGen3Impl();
	}

	getPokeStat(poke, stat) {
		if (poke.transformStats) {
			return poke.transformStats[stat];
		}
		var p = pokemonByName.get(poke.name);
		var v = p.stats[stat] * 2;
		// IVs are .dvs
		if (poke.dvs != undefined) {
			v += poke.dvs[stat];
		} else {
			v += 31;
		}
		v = parseInt((v * poke.level) / 100);
	
		if (stat == "hp") {
			v = v + poke.level + 10;
		} else {
			v = v + 5;
		}
		var nature = CalcNature.of(poke.nature);
		v = parseInt(v * nature.modifier(stat));
		return v;
	}

	getHiddenPower(poke) {
		function lSig(stat) {
			return (getDv(poke, stat) & 0b0001) >> 0;
		}
		function slSig(stat) {
			return (getDv(poke, stat) & 0b0010) >> 1;
		}
		var t = parseInt(((lSig("hp") << 0) + (lSig("atk") << 1) + (lSig("def") << 2) + (lSig("spe") << 3) + (lSig("spa") << 4) + (lSig("spd") << 5)) * 15 / 63) 
		var types = [
			"fighting", "flying", "poison", "ground",
			"rock", "bug", "ghost", "steel",
			"fire", "water", "grass", "electric",
			"psychic", "ice", "dragon", "dark"
		];
		var ty = types[t];
		var po = 30 + parseInt(((slSig("hp") << 0) + (slSig("atk") << 1) + (slSig("def") << 2) + (slSig("spe") << 3) + (slSig("spa") << 4) + (slSig("spd") << 5)) * 40 / 63);
		return { type: ty, power: po };
	}
}

class BattlePokeGen3Impl extends BattlePoke {

	getEffectiveStat(stat) {
		var v = getModifiedStatGen3(this.poke, this.stages, stat);
		var effects = BattleEffects.forStats(this);
		v = effects.getModifier(this, null, null, "stats." + stat, v, v);
		if (stat == "spe") {
			if (this.status == "prz") {
				v = parseInt(v / 4);
			}
		}
		return v;
	}
}

class BattleMoveGen3Impl extends BattleMove {

	get type() {
		/*
		if (this.move.name == "hidden-power") {
			var hp = engine.getHiddenPower(this.user.poke);
			return hp.type;
		}
		*/
		if (this.typeOverride) {
			return this.typeOverride;
		}
		if (this.move.name == "weather-ball") {
			var weather = document.getElementById("current-weather").value;
			if (weather == "rain") {
				return "water";
			} else if (weather == "sun") {
				return "fire";
			} else if (weather == "sand") {
				return "rock";
			} else if (weather == "hail") {
				return "ice";
			}
		} else if (this.move.name == "future-sight" || this.move.name == "doom-desire") {
			return "curse";
		}
		return super.type;
	}

	get power() {
		if (this.move.name == "hidden-power") {
			var hp = engine.getHiddenPower(this.user.poke);
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
		} else if (this.move.name == "low-kick") {
			return 20;
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

	function modifier(modifier, base, max) {
		return effects.getModifier(attacker, defender, move, modifier, base, max);
	}

	function modifierFloat(modifier, base, max, def) {
		return effects.getModifierFloat(attacker, defender, move, modifier, base, max, def);
	}

	function flag(flag, def = false) {
		return effects.getFlag(attacker, defender, move, flag, def);
	}

	var weather = document.getElementById("current-weather").value;
	if (flag("ignore-weather")) {
		weather = "none";
	}

	var typeOverride = effects.getValue(attacker, defender, move, "type");
	if (typeOverride) {
		move.typeOverride = typeOverride;
	}

	var v = parseInt(attacker.level * 2 / 5) + 2;
	var power = move.power;

	if (move.name == "low-kick") {
		var weight = defender.mon.weight;
		if (weight == undefined) {
			return CalcResult.of(0);
		}
		if (weight <= 10) {
			power = 20;
		} else if (weight <= 25) {
			power = 40;
		} else if (weight <= 50) {
			power = 60;
		} else if (weight <= 100) {
			power = 80;
		} else if (weight <= 200) {
			power = 100;
		} else {
			power = 120;
		}
	} else if (move.name == "water-spout") {
		power = parseInt(150 * attacker.currentHp / attacker.getStat("hp"));
	} else if (move.name == "weather-ball") {
		if (weather != "none") {
			power = power * 2;
		}
	}

	power = modifier("power", power, power);

	v = parseInt(v * power);

	special = move.category == "special";
	var attackStat = !special ? "atk" : "spa";
	var defenseStat = !special ? "def" : "spd";

	var a = getModifiedStatGen3(attacker.poke, attacker.stages, attackStat);
	var d = getModifiedStatGen3(defender.poke, defender.stages, defenseStat);
	if (move.crit) {
		if (attacker.stages[attackStat] < 0) {
			a = attacker.getStat(attackStat);
		}
		if (defender.stages[defenseStat] > 0) {
			d = defender.getStat(defenseStat);
		}
	}

	a = modifier("attack-boost", a, a);
	d = modifier("defense-boost", d, d);

	if (move.name == "explosion" || move.name == "selfdestruct") {
		d = Math.max(1, parseInt(d / 2));
	}

	v = parseInt(parseInt(v * a) / d);

	v = parseInt(v / 50);

	// Burn
	if (!special && attacker.status == "brn") {
		var burnMult = modifierFloat("burn-attack-multiplier", 0.5);
		v = parseInt(v * burnMult);
	}

	// Screens
	if (!move.crit) {
		var reduction = 0.5;
		if (document.getElementById("doubles").checked) {
			reduction = 2 / 3;
		}
		if (special && defender.hasScreen("light-screen")) {
			v = parseInt(v * reduction);
		} else if (!special && defender.hasScreen("reflect")) {
			v = parseInt(v * reduction);
		}
	}

	if (document.getElementById("doubles").checked && getTargeting(move.move).all) {
		v = parseInt(v * 0.5);
	}

	// Regular weirdness
	if (v == 0) {
		v = 1;
	}

	// TODO solar beam other weather drop
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

	v = parseInt(v * modifierFloat("flash-fire-boost", 1));

	v += 2;

	// TODO Stockpile

	if (move.crit) {
		v = parseInt(v * modifierFloat("critical-hit-multiplier", 2));
	}

	// TODO Doubled damage
	// TODO Charge
	// TODO Helping Hand

	// TODO, I don't actually know where this is supposed to go
	// Item boost
	v = parseInt(v * modifierFloat("item-boost", 1));

	var ap = attacker.mon;
	var dp = defender.mon;
	// Struggle doesn't have stab or effectiveness
	// TODO other moves
	if (move.name != "struggle") {
		// STAB
		if (contains(ap.types, move.type)) {
			v = parseInt(v * modifierFloat("stab-multiplier", 1.5));
		}

		var eff = getMatchup(move.type, dp.types[0]);
		eff = modifierFloat(`matchup.${move.type}.${dp.types[0]}`, eff);
		v = parseInt(v * eff);
		if (dp.types.length > 1) {
			eff = getMatchup(move.type, dp.types[1]);
			eff = modifierFloat(`matchup.${move.type}.${dp.types[1]}`, eff);
			v = parseInt(v * eff);
		}

		if (move.type == "ground" && !flag("grounded", !contains(dp.types, "flying"))) {
			eff = 0;
		}
		if (eff == 0) {
			return CalcResult.of(0);
		}

		v = parseInt(v * modifierFloat("type-effectiveness-multiplier", eff) / eff);
	}

	var rolls = [];
	for (var i = 85; i <= 100; i++) {
		rolls.push(parseInt(v * i / 100));
	}

	var result = CalcResult.of(rolls);

	if (move.name == "dragon-rage") {
		return CalcResult.of(40);
	} else if (move.name == "sonicboom") {
		return CalcResult.of(20);
	} else if (move.name == "seismic-toss" || move.name == "night-shade" || move.name == "psywave") {
		return CalcResult.of(attacker.level);
	} else if (move.name == "super-fang") {
		return CalcResult.of(parseInt(defender.currentHP / 2));
	}

	// TODO, not sure if these 3 go here
	result.modify(v => parseInt(v * modifierFloat("expert-belt-boost", 1)));
	result.modify(v => parseInt(v * modifierFloat("tinted-lens-boost", 1)));
	result.modify(v => parseInt(v * modifierFloat("berry-multiplier", 1)));

	if (move.name == "dragon-rage") {
		return CalcResult.of(40);
	} else if (move.name == "sonicboom") {
		return CalcResult.of(20);
	} if (move.name == "seismic-toss" || move.name == "night-shade" || move.name == "psywave") {
		return CalcResult.of(attacker.level);
	}
	// Unhandled special move
	if (power == 1) {
		return CalcResult.of(-1);
	}
	result.modify(v => modifier("damage", v, v));
	if (result.max == 0) {
		return CalcResult.of(0);
	}

	// Calc specific display

	var hits = modifier("hits", 1, 1);
	result.min = result.min * hits;
	result.max = result.max * hits;

	var drain = modifierFloat("drain", 1, 1, 0);
	if (drain != 0) {
		result.drain = drain;
	}
	var recoil = modifierFloat("recoil", 1, 1, 0);
	if (recoil != 0) {
		result.recoil = recoil;
	}
	return result;
}

function getModifiedStatGen3(poke, stages, stat) {
	var base = getPokeStat(poke, stat);
	var stage = stages[stat];
	var n = 2;
	var d = 2;
	if (stage > 0) {
		n += stage;
	} else {
		d += -stage;
	}
	return parseInt(base * n / d);
}

function getGen3SwitchScore(enemy, player, team) {
	function scoreMatchup(score, aType, dType1, dType2) {
		for (const m of data.type_matchups) {
			if (m.attacker == aType && (m.defender == dType1 || m.defender == dType2)) {
				score = parseInt(score * m.multiplier);
			}
		}
		return score;
	}
	function hasSuperEffectiveMove(attacker, defender) {
		var pp = pokemonByName.get(defender.name);
		for (var i = 0; i < attacker.moves.length; i++) {
			var move = movesByName.get(attacker.moves[i]);
			if (move.power == 0) {
				continue;
			}
			var type = move.type;
			var eff = 1;
			eff *= getMatchup(type, pp.types[0]);
			if (pp.types.length > 1) {
				eff *= getMatchup(type, pp.types[1]);
			}
			if (eff > 1) {
				return true;
			}
		}
		return false;
	}
	function getP1Score(attacker, defender) {
		var aPoke = pokemonByName.get(attacker.name);
		var dPoke = pokemonByName.get(defender.name);
		var aTypes = [...aPoke.types];
		var dTypes = [...dPoke.types];
		if (aTypes.length == 1) {
			aTypes.push(aTypes[0]);
		}
		if (dTypes.length == 1) {
			dTypes.push(dTypes[0]);
		}
		var score = 10;
		score = scoreMatchup(score, aTypes[0], dTypes[0], dTypes[1]);
		score = scoreMatchup(score, aTypes[1], dTypes[0], dTypes[1]);
		return score;
	}
	var bestScore = 0;
	var bestMon = null;
	for (const mon of team) {
		if (hasSuperEffectiveMove(mon, player)) {
			var score = getP1Score(player, mon);
			if (score != 0 && score > bestScore) {
				bestMon = mon;
				bestScore = score;
			}
		}
	}
	if (enemy == bestMon) {
		return 1;
	}
	return 0;
}
