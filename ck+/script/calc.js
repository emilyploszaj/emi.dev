class BattlePoke {
	#player;
	#stages;
	#ability;
	poke;

	static of(player, poke, stages) {
		var v = engine.createBattlePoke();
		v.#player = player;
		v.poke = poke;
		v.#stages = stages;
		var a = abilities.byName(poke.ability) ?? {"name": "none"};
		v.#ability = BattleAbility.of(v, a, a.variants?.[player ? playerAbilityVariant : enemyAbilityVariant] ?? {});
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

	get ability() {
		return this.#ability;
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
		v.#variant = move.variants?.[variant] ?? {};
		v.crit = crit;
		return v;
	}

	get name() {
		return this.move.name;
	}

	get type() {
		return this.#variant.type ?? this.move.type;
	}

	get category() {
		return this.#variant.category ?? this.move.category;
	}

	get power() {
		return this.#variant.power ?? this.move.power;
	}

	get effects() {
		return this.#variant.effects ?? this.move.effects;
	}

	hasFlag(flag) {
		return contains(this.move.flags ?? [], flag);
	}

	getEffectiveness(target) {
		return getMatchup(this.type, target.mon.types[0]) * getMatchup(this.type, target.mon.types[1]);
	}
}

class BattleAbility {
	#variant;

	static of(user, ability, variant) {
		var v = new BattleAbility();
		v.user = user;
		v.ability = ability;
		v.#variant = variant;
		return v;
	}

	get name() {
		return this.ability.name;
	}

	get effects() {
		return this.#variant.effects ?? this.ability.effects;
	}
}

class CalcResult {

	constructor(rolls, min, max) {
		this.rolls = rolls;
		this.min = min;
		this.max = max;
	}

	static of(value) {
		if (Array.isArray(value)) {
			return new CalcResult(value, Math.min(...value), Math.max(...value));
		} else {
			return new CalcResult([value], value, value);
		}
	}

	modify(func) {
		for (var i = 0; i < this.rolls.length; i++) {
			this.rolls[i] = func(this.rolls[i]);
		}
		this.min = func(this.min);
		this.max = func(this.max);
	}
}

const NATURE_TABLE = {
	atk: {
		atk: "hardy",
		def: "lonely",
		spa: "adamant",
		spd: "naughty",
		spe: "brave",
	},
	def: {
		atk: "bold",
		def: "docile",
		spa: "impish",
		spd: "lax",
		spe: "relaxed",
	},
	spa: {
		atk: "modest",
		def: "mild",
		spa: "bashful",
		spd: "rash",
		spe: "quiet",
	},
	spd: {
		atk: "calm",
		def: "gentle",
		spa: "careful",
		spd: "quirky",
		spe: "sassy",
	},
	spe: {
		atk: "timid",
		def: "hasty",
		spa: "jolly",
		spd: "naive",
		spe: "serious",
	}
}
for (const boon of Object.keys(NATURE_TABLE)) {
	for (const bane of Object.keys(NATURE_TABLE)) {
		NATURE_TABLE[NATURE_TABLE[boon][bane]] = [boon, bane];
	}
}

function getNature(boon, bane) {
	return NATURE_TABLE[boon]?.[bane] ?? "hardy";
}

function hasBadgeBoost(poke, player) {
	return player == (poke.transformStats == undefined)
}

function getPokeStat(poke, stat) {
	return engine.getPokeStat(poke, stat);
}

function setTagPlayer(i) {
	myPoke = trainersByName.get(playerTagPartners[currentTagPartner]).team[i];
	clearPlayerStages();
	updateCalc();
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

function resetBattleSettings() {
	document.getElementById("current-weather").value = "none";
	document.getElementById("doubles").checked = false;
}

function calcTrainer(i, startup = false) {
	if (isTrainerB2b(i)) {
		calcTrainer(i - 1);
		return;
	}
	var trainer = data.trainers[i];

	resetBattleSettings();
	if (trainer["battle-effects"]?.format == "multi" || trainer["battle-effects"]?.format == "doubles") {
		document.getElementById("doubles").checked = true;
	}
	if (trainer["battle-effects"]?.weather != undefined) {
		document.getElementById("current-weather").value = trainer["battle-effects"]?.weather;
	}

	lastTrainer = i;
	savedData["last-trainer"] = lastTrainer;
	writeLocalStorage();
	currentTagPartner = 0;
	if (trainer["player-partners"]) {
		playerTagPartners = trainer["player-partners"];
	} else {
		playerTagPartners = [];
	}
	calcTagPartners();
	enemyTeam = trainer.team;
	document.getElementById("current-trainer-name").innerHTML = `${getTrainerName(trainer.name)}`;
	document.getElementById("current-trainer-navigate").href = `#/trainer/${trainer.name}/`;
	setEnemy(lastTrainer, 0);
	if (!startup) {
		navigate("#/calc/");
		history.pushState(getLinkState(), "", "#/calc/");
	}
}

function calcTagPartners() {
	if (playerTagPartners.length > 0) {
		document.getElementById("tag-partner-team").style.display = "initial";
		var partner = trainersByName.get(playerTagPartners[currentTagPartner]);
		var cycling = "";
		if (playerTagPartners.length > 1) {
			cycling = `<div id="tag-cycle-buttons"><button onclick="cycleTagPartner(-1)">Previous</button><button onclick="cycleTagPartner(1)">Next</button></div>`;
		}
		document.getElementById("tag-partner-name").innerHTML = `${getTrainerName(partner.name)}${cycling}`
		document.getElementById("tag-partner-meta").innerHTML = `${partner.meta ?? "Tag Partner"}`
	} else {
		document.getElementById("tag-partner-team").style.display = "none";
	}
}

function cycleTagPartner(i) {
	currentTagPartner += i;
	if (currentTagPartner < 0) {
		currentTagPartner = playerTagPartners.length - 1;
	} else if (currentTagPartner >= playerTagPartners.length) {
		currentTagPartner = 0;
	}
	calcTagPartners(i);
	updateCalc();
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