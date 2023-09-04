function updateCalc() {
	try {
		displayCalcPokemon(document.getElementById("player"), myPoke, theirPoke, false);
		displayCalcPokemon(document.getElementById("opponent"), theirPoke, myPoke, true);
		var v = "";
		for (var i = 0; i < box.length && i < box.length; i++) {
			var img = '<img src="' + getPokeImage(box[i]) + '">';
			v += '<div onclick="setPlayer(' + i + ')">' + img + "</div>";
		}
		document.getElementById("player").getElementsByClassName("calc-team")[0].innerHTML = v;
		document.getElementById("opponent").getElementsByClassName("calc-team")[0].innerHTML = getEnemyTeamDisplay(enemyTeam, lastTrainer);
		var extraTrainers = "";
		for (var i = lastTrainer + 1; isTrainerB2b(i); i++) {
			extraTrainers += `<div class="calc-team">${getEnemyTeamDisplay(data.trainers[i].team, i)}</div>`;
			extraTrainers += `<div class="calc-navigation"><span>${getTrainerName(data.trainers[i].name)} </span>`;
			extraTrainers += `<button onclick="focusTrainer(${i})">Stats</button> `;
			extraTrainers += `<button disabled=true onclick="navigateBattle(-1)">Previous</button> `;
			extraTrainers += `<button disabled=true onclick="navigateBattle(1)">Next</button> `;
			extraTrainers += `</div>`
		}
		document.getElementById("opponent").getElementsByClassName("extra-calc-teams")[0].innerHTML = extraTrainers;
	} catch(e) {
		console.log(e);
	}
}

function getEnemyTeamDisplay(enemyTeam, trainer) {
	var v = "";
	for (let i in enemyTeam) {
		var prio = getSwitchPriority(enemyTeam[i], myPoke);
		var prioClass = "neutral-switch-priority";
		if (prio < 0) {
			prioClass = "low-switch-priority";
		} else if (prio > 0) {
			prioClass = "high-switch-priority";
		}
		var img = '<img class="' + prioClass + '" src="' + getPokeImage(enemyTeam[i]) + '">';
		v += `<div onclick="setEnemy(${trainer}, ${i})">${img}</div>`;
	}
	return v;
}

function getDamage(attacker, defender, attackerStages, defenderStages, move, player, crit, low, giveAll = false) {
	if (defender == undefined) {
		return 0;
	}
	var power = move.power;
	var type = move.type;
	if (move.name == "magnitude") {
		if (giveAll) {
			power = 70
		} else {
			if (low) {
				power = 10;
			} else {
				power = 150;
			}
		}
	}
	if (move.name == "hidden-power") {
		var hp = getHiddenPower(attacker);
		power = hp.power;
		type = hp.type;
	}
	if (move.name == "flail" || move.name == "reversal") {
		var mhp = getPokeStat(attacker, "hp");
		var chp = parseInt(document.getElementsByClassName("player-current-hp")[0].value);
		if (!player) {
			chp = parseInt(document.getElementsByClassName("enemy-current-hp")[0].value);
		}
		var ratio = chp / mhp;
		if (ratio < 0.0417) {
			power = 200;
		} else if (ratio < 0.1042) {
			power = 150;
		} else if (ratio < 0.2083) {
			power = 100;
		} else if (ratio < 0.3542) {
			power = 80;
		} else if (ratio < 0.6875) {
			power = 40;
		} else {
			power = 20;
		}
	}
	if (power == 0) {
		return 0;
	}
	var ap = pokemonByName.get(attacker.name);
	var dp = pokemonByName.get(defender.name);
	var v = parseInt(attacker.level * 2 / 5) + 2;
	v *= power;

	var special = specialTypes.has(type);
	var statOff = 0;
	if (special) {
		statOff = 1;
	}
	var attackStat = ["atk", "spa"][statOff];
	var defenseStat = ["def", "spd"][statOff];

	var a = getModifiedStat(attacker, attackerStages, attackStat);
	var d = getModifiedStat(defender, defenderStages, defenseStat);
	var ignoreBoosts = false;
	if (crit) {
		if (defenderStages[defenseStat] >= attackerStages[attackStat]) {
			a = getPokeStat(attacker, attackStat);
			d = getPokeStat(defender, defenseStat);
			ignoreBoosts = true;
		}
	}
	if (move.name == "explosion" || move.name == "selfdestruct") {
		d = Math.max(1, parseInt(d / 2));
	}

	if (!ignoreBoosts) {
		// Burn
		if (!special) {
			if (player && document.getElementById("player").getElementsByClassName("status-select")[0].value == "brn") {
				a = (parseInt(a / 2));
			} else if (!player && document.getElementById("opponent").getElementsByClassName("status-select")[0].value == "brn") {
				a = (parseInt(a / 2));
			}
		}
		// Badge boost
		var attackerBoost = hasBadgeBoost(attacker, player);
		var defenderBoost = hasBadgeBoost(defender, !player);
		if (attackerBoost && !special && badges >= attackBadges) {
			a = parseInt(a * 1.125);
		}
		if (defenderBoost && !special && badges >= defenseBadges) {
			d = parseInt(d * 1.125);
		}
		if (attackerBoost && special && badges >= specialBadges) {
			a = parseInt(a * 1.125);
		}
		if (defenderBoost && special && badges >= specialBadges) {
			d = parseInt(d * 1.125);
		}
		// Screens
		if (player) {
			if (!special && document.getElementById("enemy-reflect").checked) {
				d *= 2;
			} else if (special && document.getElementById("enemy-light-screen").checked) {
				d *= 2;
			}
		} else {
			if (!special && document.getElementById("player-reflect").checked) {
				d *= 2;
			} else if (special && document.getElementById("player-light-screen").checked) {
				d *= 2;
			}
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
	v = parseInt(parseInt(v * a) / d);

	v = parseInt(v / 50);
	if (crit) {
		v *= 2;
	}
	if (typeEnhancements.has(ni) && typeEnhancements.get(ni) == type) {
		v *= 1.1;
		v = parseInt(v);
	}
	v += 2;

	if (move.name == "triple-kick" && !giveAll) {
		return getModdedDamage(v, attacker, defender, ap, dp, power, type, move, player, crit, low, giveAll, 1)
			+ getModdedDamage(v, attacker, defender, ap, dp, power, type, move, player, crit, low, giveAll, 2)
			+ getModdedDamage(v, attacker, defender, ap, dp, power, type, move, player, crit, low, giveAll, 3);
	}

	return getModdedDamage(v, attacker, defender, ap, dp, power, type, move, player, crit, low, giveAll, 1);
}

function getModdedDamage(v, attacker, defender, ap, dp, power, type, move, player, crit, low, giveAll, tk) {
	v *= tk;

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

	// TODO if (weather)

	if (player && badgeTypes.has(type) && badgeTypes.get(type) <= badges) {
		v = parseInt(v * 1.125);
	}

	// STAB
	if (type == ap.types[0] || (ap.types.length > 1 && type == ap.types[1])) {
		v = parseInt(v * 1.5);
	}

	var eff = 1;
	eff *= getMatchup(type, dp.types[0]);
	if (dp.types.length > 1) {
		eff *= getMatchup(type, dp.types[1]);
	}
	if (eff == 0) {
		return 0;
	}
	v *= eff;

	if (move.name == "dragon-rage") {
		return 40;
	} else if (move.name == "sonicboom") {
		return 20;
	} if (move.name == "seismic-toss" || move.name == "night-shade" || move.name == "psywave") {
		return attacker.level;
	}
	// Unhandled special move
	if (power == 1) {
		return -1;
	}

	if (giveAll) {
		var rolls = [];
		for (var i = 217; i <= 255; i++) {
			rolls.push(Math.max(1, parseInt(v * i / 255)));
		}
		return rolls;
	}

	var r = 255;
	if (low) {
		r = 217;
	}
	v = parseInt(v * r / 255);

	var times = 1;
	if (doubleHitMoves.has(move.name)) {
		times = 2;
	} else if (multiHitMoves.has(move.name)) {
		if (low) {
			times = 2;
		} else {
			times = 5;
		}
	}
	return Math.max(1, v) * times;
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
	localStorage.setItem("last-trainer", i);
	lastTrainer = i;
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