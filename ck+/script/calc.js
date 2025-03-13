class BattlePoke {
	#player;
	#stages;
	poke;

	static of(player, poke, stages) {
		var v = engine.createBattlePoke();
		v.#player = player;
		v.poke = poke;
		v.#stages = stages;
		return v;
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
		return this.poke.item.toLowerCase().replace(/ /g, "-");
	}

	get level() {
		return this.poke.level;
	}

	get name() {
		return this.poke.name;
	}

	getStat(stat) {
		return engine.getPokeStat(this.poke, stat);
	}

	getEffectiveStat(stat) {
		return this.getStat(stat);
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
	#variant;

	static of(user, move, variant, crit) {
		var v = engine.createBattleMove();
		v.user = user;
		v.move = move;
		v.#variant = orElse(orElse(move.variants, [])[variant], {});
		v.crit = crit;
		return v;
	}

	get name() {
		return this.move.name;
	}

	get type() {
		return orElse(this.#variant.type, this.move.type);
	}

	get category() {
		return orElse(this.#variant.category, this.move.category);
	}

	get power() {
		return orElse(this.#variant.power, this.move.power);
	}

	get effects() {
		return orElse(this.#variant.effects, this.move.effects);
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
	document.getElementById("current-trainer-name").innerHTML = `${getTrainerName(data.trainers[i].name)}`;
	document.getElementById("current-trainer-navigate").href = `#/trainer/${data.trainers[i].name}/`;
	setEnemy(lastTrainer, 0);
	navigate("#/calc/");
	history.pushState(getLinkState(), "", "#/calc/");
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