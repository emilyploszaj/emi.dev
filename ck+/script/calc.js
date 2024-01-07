class BattlePoke {
	#player;
	#stages;

	constructor(player, poke, stages) {
		this.#player = player;
		this.poke = poke;
		this.#stages = stages;
	}

	isPlayer() {
		return this.#player;
	}

	get currentHp() {
		if (this.#player) {
			return parseInt(document.getElementsByClassName("player-current-hp")[0].value);
		} else {
			return parseInt(document.getElementsByClassName("enemy-current-hp")[0].value);
		}
	}

	get status() {
		if (this.#player) {
			return document.getElementById("player").getElementsByClassName("status-select")[0].value;
		} else {
			return document.getElementById("opponent").getElementsByClassName("status-select")[0].value;
		}
	}

	get mon() {
		return pokemonByName.get(this.poke.name);
	}

	get stages() {
		return this.#stages;
	}

	get item() {
		return this.poke.item;
	}

	get level() {
		return this.poke.level;
	}

	get name() {
		return this.poke.name;
	}

	getStat(stat) {
		return getPokeStat(this.poke, stat);
	}

	getModifiedStat(stat) {
		return getModifiedStat(this.poke, this.#stages, stat);
	}

	hasScreen(screen) {
		if (this.#player) {
			if (screen == "reflect") {
				return document.getElementById("player-reflect").checked;
			} else if (screen == "light-screen") {
				return document.getElementById("player-light-screen").checked;
			}
		} else {
			if (screen == "reflect") {
				return document.getElementById("enemy-reflect").checked;
			} else if (screen == "light-screen") {
				return document.getElementById("enemy-light-screen").checked;
			}
		}
	}

	hasBadgeBoost() {
		return hasBadgeBoost(this.poke, this.#player)
	}
}

class BattleMove {
	#user;
	#variant;

	constructor(user, move, variant, crit) {
		this.#user = user;
		this.move = move;
		this.#variant = orElse(orElse(move.variants, [])[variant], {});
		this.crit = crit;
	}

	get name() {
		return this.move.name;
	}

	get type() {
		if (this.move.name == "hidden-power") {
			var hp = getHiddenPower(this.#user.poke);
			return hp.type;
		} else {
			return orElse(this.#variant.type, this.move.type);
		}
	}

	get power() {
		if (this.move.name == "hidden-power") {
			var hp = getHiddenPower(this.#user.poke);
			return hp.power;
		} else if (this.move.name == "flail" || this.move.name == "reversal") {
			var mhp = this.#user.getStat("hp");
			var chp = this.#user.currentHp;
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
		return orElse(this.#variant.power, this.move.power);
	}

	get hits() {
		return orElse(orElse(orElse(this.#variant.effects, {}).hits, orElse(this.move.effects, {}).hits), 1);
	}

	get multiplier() {
		return orElse(orElse(orElse(this.#variant.effects, {}).multiplier, orElse(this.move.effects, {}).multiplier), 1);
	}
}

class CalcResult {

	constructor(rolls, min, max) {
		this.rolls = rolls;
		this.min = min;
		this.max = max;
	}

	static of(mono) {
		return new CalcResult([mono], mono, mono);
	}
}

/**
 * @param {BattlePoke} attacker
 * @param {BattlePoke} defender
 * @param {BattleMove} move
 * @return {CalcResult}
 */
function getDamage(attacker, defender, move) {
	if (defender.poke == undefined) {
		return CalcResult.of(0);
	}
	if (move.power == 0) {
		return CalcResult.of(0);
	}
	var v = parseInt(attacker.level * 2 / 5) + 2;
	v *= move.power;

	var special = specialTypes.has(move.type);
	var statOff = 0;
	if (special) {
		statOff = 1;
	}
	var attackStat = ["atk", "spa"][statOff];
	var defenseStat = ["def", "spd"][statOff];

	var a = attacker.getModifiedStat(attackStat);
	var d = defender.getModifiedStat(defenseStat);
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

	var ni = attacker.item.toLowerCase().replace(/ /g, "-");
	var ndi = defender.item.toLowerCase().replace(/ /g, "-");

	if ((attacker.name == "cubone" || attacker.name == "marowak") && ni == "thick-club" && !special) {
		a *= 2;
	}
	if (attacker.name == "pikachu" && ni == "light-ball" && special) {
		a *= 2;
	}
	if ((defender.name == "ditto" || defender.transformStats) && ndi == "metal-powder") {
		d = d * 1.5;
	}

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
	if (typeEnhancements.has(ni) && typeEnhancements.get(ni) == move.type) {
		v *= 1.1;
		v = parseInt(v);
	}
	if (move.crit) {
		v *= 2;
	}
	v += 2;

	if (move.name == "triple-kick") {
		// TODO do triple kick again
		var tk1 = getModdedDamage(v, attacker, defender, move);
		var tk2 = getModdedDamage(v * 2, attacker, defender, move);
		var tk3 = getModdedDamage(v * 3, attacker, defender, move);
		return new CalcResult(tk1.rolls, tk1.min + tk2.min + tk3.min, tk1.max + tk2.max + tk3.max);
	}

	return getModdedDamage(v, attacker, defender, move);
}

/**
 * @param {BattlePoke} attacker
 * @param {BattlePoke} defender
 * @param {BattleMove} move
 * @return {CalcResult}
 */
function getModdedDamage(v, attacker, defender, move) {
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
	if (move.type == ap.types[0] || (ap.types.length > 1 && move.type == ap.types[1])) {
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
	v *= move.multiplier;

	var rolls = [];
	for (var i = 217; i <= 255; i++) {
		rolls.push(Math.max(1, parseInt(v * i / 255)));
	}
	var min = rolls[0] * move.hits;
	var max = rolls[rolls.length - 1] * move.hits;
	return new CalcResult(rolls, min, max);
}

function hasBadgeBoost(poke, player) {
	return player == (poke.transformStats == undefined)
}

function getPokeStat(poke, stat) {
	if (poke.transformStats) {
		return poke.transformStats[stat];
	}
	var p = pokemonByName.get(poke.name);
	var v = p.stats[stat];
	if (poke.dvs != undefined) {
		v += poke.dvs[stat];
	} else {
		v += 15;
	}
	v = parseInt((v * 2 * poke.level) / 100);

	if (stat == "hp") {
		return v + poke.level + 10;
	} else {
		return v + 5;
	}
}

function getModifiedStat(poke, stages, stat) {
	var base = getPokeStat(poke, stat);
	var stage = stages[stat];
	var modifiers = [25, 28, 33, 40, 50, 66, 100, 150, 200, 250, 300, 350, 400];
	return parseInt(base * modifiers[stage + 6] / 100);
}

function setPlayer(i) {
	myPoke = box[i];
	clearPlayerStages();
	updateCalc();
}

function setEnemy(trainer, i) {
	theirPoke = data.trainers[trainer].team[i];
	clearEnemyStages();
	updateCalc();
}

function navigateBattle(i) {
	lastTrainer += i;
	while (isTrainerB2b(lastTrainer) && i > 0) {
		lastTrainer += i;
	}
	if (lastTrainer < 0) {
		lastTrainer = 0;
	} else if (lastTrainer >= data.trainers.length) {
		lastTrainer = data.trainers.length - 1;
	}
	calcTrainer(lastTrainer);
}

function isTrainerB2b(i) {
	if (data.trainers[i]) {
		return data.trainers[i].b2b == true;
	}
	return false;
}

function calcTrainer(i) {
	if (isTrainerB2b(i)) {
		calcTrainer(i - 1);
		return;
	}
	lastTrainer = i;
	savedData["last-trainer"] = lastTrainer;
	writeLocalStorage();
	enemyTeam = data.trainers[i].team;
	document.getElementById("current-trainer-name").innerHTML =
		`${getTrainerName(data.trainers[i].name)}`;
	setEnemy(lastTrainer, 0);
	setTab("calc");
}

function transform(right) {
	var p;
	if (right) {
		var p = JSON.parse(JSON.stringify(myPoke));
		p.transformStats = {
			"hp": getPokeStat(theirPoke, "hp"),
			"atk": getPokeStat(myPoke, "atk"),
			"def": getPokeStat(myPoke, "def"),
			"spa": getPokeStat(myPoke, "spa"),
			"spd": getPokeStat(myPoke, "spd"),
			"spe": getPokeStat(myPoke, "spe")
		};
		p.level = theirPoke.level;
		p.item = theirPoke.item;
		theirPoke = p;
	} else {
		var p = JSON.parse(JSON.stringify(theirPoke));
		p.transformStats = {
			"hp": getPokeStat(myPoke, "hp"),
			"atk": getPokeStat(theirPoke, "atk"),
			"def": getPokeStat(theirPoke, "def"),
			"spa": getPokeStat(theirPoke, "spa"),
			"spd": getPokeStat(theirPoke, "spd"),
			"spe": getPokeStat(theirPoke, "spe")
		};
		p.level = myPoke.level;
		p.item = myPoke.item;
		myPoke = p;
	}
	updateCalc();
}