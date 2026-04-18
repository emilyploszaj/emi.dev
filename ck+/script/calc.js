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

class CalcNature {
	static #TABLE = {
		"hardy":   new CalcNature("hardy",   {}, "atk"),
		"lonely":  new CalcNature("lonely",  {"atk": 1.1, "def": 0.9}),
		"adamant": new CalcNature("adamant", {"atk": 1.1, "spa": 0.9}),
		"naughty": new CalcNature("naughty", {"atk": 1.1, "spd": 0.9}),
		"brave":   new CalcNature("brave",   {"atk": 1.1, "spe": 0.9}),
		"bold":    new CalcNature("bold",    {"def": 1.1, "atk": 0.9}),
		"docile":  new CalcNature("docile",  {}, "def"),
		"impish":  new CalcNature("impish",  {"def": 1.1, "spa": 0.9}),
		"lax":     new CalcNature("lax",     {"def": 1.1, "spd": 0.9}),
		"relaxed": new CalcNature("relaxed", {"def": 1.1, "spe": 0.9}),
		"modest":  new CalcNature("modest",  {"spa": 1.1, "atk": 0.9}),
		"mild":    new CalcNature("mild",    {"spa": 1.1, "def": 0.9}),
		"bashful": new CalcNature("bashful", {}, "spa"),
		"rash":    new CalcNature("rash",    {"spa": 1.1, "spd": 0.9}),
		"quiet":   new CalcNature("quiet",   {"spa": 1.1, "spe": 0.9}),
		"calm":    new CalcNature("calm",    {"spd": 1.1, "atk": 0.9}),
		"gentle":  new CalcNature("gentle",  {"spd": 1.1, "def": 0.9}),
		"careful": new CalcNature("careful", {"spd": 1.1, "spa": 0.9}),
		"quirky":  new CalcNature("quirky",  {}, "spd"),
		"sassy":   new CalcNature("sassy",   {"spd": 1.1, "spe": 0.9}),
		"timid":   new CalcNature("timid",   {"spe": 1.1, "atk": 0.9}),
		"hasty":   new CalcNature("hasty",   {"spe": 1.1, "def": 0.9}),
		"jolly":   new CalcNature("jolly",   {"spe": 1.1, "spa": 0.9}),
		"naive":   new CalcNature("naive",   {"spe": 1.1, "spd": 0.9}),
		"serious": new CalcNature("serious", {}, "spe"),
		"none":    new CalcNature("none",    {}),
		"wild":    new CalcNature("wild",    {"atk": 1.1, "spa": 1.1, "def": 0.9, "spd": 0.9}),
	};
	static #EMPTY = new CalcNature("none", {});

	#name;
	#modifiers;
	#focus;

	constructor(name, modifiers, focus) {
		this.#name = name;
		this.#modifiers = modifiers;
		this.#focus = focus;
	}

	static of(boon, bane) {
		if (bane == undefined) {
			var name = boon;
			return CalcNature.#TABLE[name] ?? CalcNature.#EMPTY;
		} else {

			for (const k in CalcNature.#TABLE) {
				var v = CalcNature.#TABLE[k];
				if (v.isBoon(boon) && v.isBane(bane)) {
					return v;
				} else if (boon == bane && v.isFocus(boon)) {
					return v;
				}
			}
			return this.#EMPTY;
		}
	}

	get name() {
		return this.#name ?? "hardy";
	}

	modifier(stat) {
		return this.#modifiers[stat] ?? 1;
	}

	isBoon(stat) {
		return this.modifier(stat) > 1;
	}

	isBane(stat) {
		return this.modifier(stat) < 1;
	}

	isFocus(stat) {
		return this.#focus == stat;
	}

	withBoon(stat) {
		for (const k in this.#modifiers) {
			if (this.#modifiers[k] < 1) {
				return CalcNature.of(stat, k);
			}
		}
		if (this.#focus != undefined) {
			return CalcNature.of(stat, this.#focus);
		}
		return CalcNature.of(stat, stat);
	}

	withBane(stat) {
		for (const k in this.#modifiers) {
			if (this.#modifiers[k] > 1) {
				return CalcNature.of(k, stat);
			}
		}
		if (this.#focus != undefined) {
			return CalcNature.of(this.#focus, stat);
		}
		return CalcNature.of(stat, stat);
	}
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

function setPlayerRemote(i, event) {
	myPoke = soulLinkBoxByArea.get(box[i].caught);
	clearPlayerStages();
	updateCalc();
	event.stopPropagation();
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
	faintedMonToggles.clear();
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