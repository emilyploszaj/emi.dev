var menuOpen;
var playerMoveVariants = [-1, -1, -1, -1];
var enemyMoveVariants = [-1, -1, -1, -1];

function displayCalcPokemon(root, poke, opponent, right) {
	var player = !right;
	var p = pokemonByName.get(poke.name);
	var attackerStages = getStages("player-stages");
	var defenderStages = getStages("enemy-stages");
	if (!player) {
		var attackerStages = getStages("enemy-stages");
		var defenderStages = getStages("player-stages");
	}
	var attacker = BattlePoke.of(player, poke, attackerStages);
	var defender = BattlePoke.of(!player, opponent, defenderStages);

	root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(p);
	if (poke.transformStats) {
		root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(pokemonByName.get("ditto"));
	}
	root.getElementsByClassName("poke-level")[0].innerHTML = "Lvl " + poke.level;
	root.getElementsByClassName("poke-item")[0].innerHTML = itemLink(poke.item);
	root.getElementsByClassName("poke-icon")[0].innerHTML = '<img draggable="false" src="' + getPokeImage(poke) + '">';
	root.getElementsByClassName("poke-gender")[0].innerHTML = ["∅", "♀", "♂"][getGender(poke)];
	if (right && root.getElementsByClassName("experience").length > 0) {
		var exp = p.base_experience;
		if (poke.transformStats) {
			exp = pokemonByName.get("ditto").base_experience;
		}
		exp = parseInt(exp * 1.5); // Trainer
		exp = parseInt(exp * poke.level);
		exp = parseInt(exp / 7);
		var inner = "<h3>Experience split:</h3>";
		for (var i = 2; i < 7; i++) {
			inner += "<p>" + parseInt(exp / i) + " exp to " + i + " Pokemon</p>";
		}
		root.getElementsByClassName("experience")[0].innerHTML = "<span> (" + exp + " exp)<div class='rolls'><center>" + inner + "</center></div></span>";
	}
	var hp = 10;
	if (opponent) {
		hp = getPokeStat(opponent, "hp");
	}
	var status = "none";
	var enemyStatus = "none";
	var myHp = getPokeStat(poke, "hp");
	if (root.getElementsByClassName("status-select")[0]) {
		status = root.getElementsByClassName("status-select")[0].value;
		enemyStatus = document.getElementById("opponent").getElementsByClassName("status-select")[0].value;
		if (!player) {
			enemyStatus = document.getElementById("player").getElementsByClassName("status-select")[0].value;
		}
	}

	document.getElementById("player-current-level").value = myPoke.level;

	var cHp = document.getElementsByClassName("player-current-hp")[0];
	var oHp = document.getElementsByClassName("enemy-current-hp")[0];
	if (!player) {
		cHp = document.getElementsByClassName("enemy-current-hp")[0];
		oHp = document.getElementsByClassName("player-current-hp")[0];
	}
	if (cHp.value == "") {
		cHp.value = myHp;
	}

	var myCurrentHp = cHp.value;
	var opponentCurrentHp = oHp.value;

	displayCalcStat(root.getElementsByClassName("calc-hp")[0], attacker, "hp");
	displayCalcStat(root.getElementsByClassName("calc-atk")[0], attacker, "atk");
	displayCalcStat(root.getElementsByClassName("calc-def")[0], attacker, "def");
	displayCalcStat(root.getElementsByClassName("calc-spa")[0], attacker, "spa");
	displayCalcStat(root.getElementsByClassName("calc-spd")[0], attacker, "spd");
	displayCalcStat(root.getElementsByClassName("calc-spe")[0], attacker, "spe");
	if (opponent) {
		var mySpe = attacker.getEffectiveStat("spe");
		var theirSpe = defender.getEffectiveStat("spe");
		if (mySpe > theirSpe) {
			var prio = hasPriority(opponent) ? '<span class="has-priority">*</span>' : "";
			root.getElementsByClassName("speed-indicator")[0].innerHTML = '<div class="speed-faster">&laquo;</div>' + prio;
		} else if (mySpe == theirSpe) {
			var prio = (hasPriority(poke) || hasPriority(opponent)) ? '<span class="has-priority">*</span>' : "";
			root.getElementsByClassName("speed-indicator")[0].innerHTML = '<div class="speed-tied">-</div>' + prio;
		} else {
			var prio = hasPriority(poke) ? '<span class="has-priority">*</span>' : "";
			root.getElementsByClassName("speed-indicator")[0].innerHTML = '<div class="speed-slower">&laquo;</div>' + prio;
		}
	}
	var types = prettyType(p.types[0]);
	if (p.types.length > 1) {
		types += " " + prettyType(p.types[1]);
	}
	root.getElementsByClassName("poke-types")[0].innerHTML = types;
	var moves = '<table class="move-calcs">';
	var variantArray = player ? playerMoveVariants : enemyMoveVariants;
	for (var i = 0; i < 4; i++) {
		if (i < poke.moves.length) {
			var move = movesByName.get(poke.moves[i]);
			var variants = "";
			if (move.variants && move.variants.length > 0) {
				var variantCount = move.variants.length;
				variants += `<div class="move-calc-variants">`;
				for (var vr = 0; vr < variantCount; vr++) {
					var varClasses = "move-calc-variant"
					if (vr == variantArray[i]) {
						varClasses += " move-calc-variant-selected";
					}
					variants += `<div title="${move.variants[vr].description}" onclick="setMoveVariant(${player}, ${i}, ${vr});" class="${varClasses}"></div>`;
				}
				variants += `</div>`;
			}
			var p1 = `<td class="move-calc">${moveLink(poke.moves[i])}${variants}</td>`;
			var result = engine.getDamage(attacker, defender, BattleMove.of(attacker, move, variantArray[i], false));
			var rolls = result.rolls;
			var min = result.min;
			var max = result.max;
			if (variantArray[i] < 0 && move.roll_variants) {
				for (var vr = 0; vr < move.variants.length; vr++) {
					var vRes = engine.getDamage(attacker, defender, BattleMove.of(attacker, move, vr, false));
					min = Math.min(vRes.min, min);
					max = Math.max(vRes.max, max);
				}
			}
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = "";
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra += ' ohko';
			} else if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra += ' thko';
			}
			var p2 = moveDisplay(min, max, minPercent, maxPercent, extra, prettyRolls(rolls, myHp, myCurrentHp, opponentCurrentHp, result), move.power)
			if (max == 0 && move.power == 0) {
				if (move.name == "transform") {
					p2 = '<td class="move-calc"><button onclick="transform(' + right + ')">Transform</button></td>';
				} else {
					p2 = '<td class="move-calc">Status</td>';
				}
			}
			if (opponent == undefined) {
				p2 = `<td class="move-calc">-</td>`;
			}
			var result = engine.getDamage(attacker, defender, BattleMove.of(attacker, move, variantArray[i], true));
			var rolls = result.rolls;
			var min = result.min;
			var max = result.max;
			if (variantArray[i] < 0 && move.roll_variants) {
				for (var vr = 0; vr < move.variants.length; vr++) {
					var vRes = engine.getDamage(attacker, defender, BattleMove.of(attacker, move, vr, true));
					min = Math.min(vRes.min, min);
					max = Math.max(vRes.max, max);
				}
			}
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = " crit";
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra += ' ohko';
			} else if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra += ' thko';
			}
			var p3 = moveDisplay(min, max, minPercent, maxPercent, extra, prettyRolls(rolls, myHp, myCurrentHp, opponentCurrentHp, result), move.power);
			moves += "<tr>";
			if (right) {
				moves += p3 + p2 + p1;
			} else {
				moves += p1 + p2 + p3;
			}
			moves += "</tr>";
		} else {
			var blank = `<td class="move-calc"><ruby>-<rt>​</rt></ruby></td>`;
			moves += `<tr>${blank}${blank}${blank}</tr>`;
		}
	}
	moves += "</table>"
	root.getElementsByClassName("calc-moves")[0].innerHTML = moves;
	if (!right && opponent) {
		displayResiduals(root, attacker, defender);
	}
}

function moveDisplay(min, max, minPercent, maxPercent, classes, tooltip, power) {
	var v = `<td class="move-calc ${classes}"><ruby>${min} - ${max}<rt>${minPercent}% - ${maxPercent}%</rt></ruby>${tooltip}</td>`;
	if (max == 0 && power == 0) {
		v = '<td class="move-calc"><ruby><rt>​</rt></ruby></td>';
	}
	return v;
}

function prettyRolls(rolls, myHp, myCurrentHp, killHp, result) {
	if (!rolls.length) {
		rolls = [rolls];
	}
	if (rolls.length == 0) {
		return "";
	}
	var v = '<div class="rolls">';
	v += "<center><h1>Rolls:</h1>";
	v += `<table><tr>`;
	var kills = 0;
	for (var i = 0; i < rolls.length; i++) {
		if (rolls[i] >= killHp) {
			kills++;
			v += `<td class="crit">${rolls[i]}</td>`;
		} else {
			v += `<td>${rolls[i]}</td>`;
		}
		if ((i + 1) % 8 == 0 && i + 1 < rolls.length) {
			v += `</tr><tr>`;
		}
	}
	v += `</tr></table>`;
	kills = Math.round(1000 * kills / rolls.length) / 10;
	v += `${kills}% chance to OHKO`;
	if (result) {
		if (result.recoil > 0) {
			var min = parseInt(Math.min(killHp, rolls[0]) * result.recoil);
			var max = parseInt(Math.min(killHp, rolls[rolls.length - 1]) * result.recoil);
			var minPercent = Math.round(1000 * min / myHp) / 10;
			var maxPercent = Math.round(1000 * max / myHp) / 10;
			var extra = "";
			if (max >= myCurrentHp) {
				extra = "ohko";
			}
			v += "<h1>Recoil:</h1>";
			v += `<table><tr>${moveDisplay(min, max, minPercent, maxPercent, extra, "", -1)}</tr></table>`;
		}
		if (result.drain > 0) {
			var min = parseInt(Math.min(killHp, rolls[0]) * result.drain);
			var max = parseInt(Math.min(killHp, rolls[rolls.length - 1]) * result.drain);
			var minPercent = Math.round(1000 * min / myHp) / 10;
			var maxPercent = Math.round(1000 * max / myHp) / 10;
			var extra = "";
			if (max >= myCurrentHp) {
				extra = "ohko";
			}
			v += "<h1>Heal:</h1>";
			v += `<table><tr>${moveDisplay(min, max, minPercent, maxPercent, extra, "", -1)}</tr></table>`;
		}
	}
	v += "</center></div>";
	return v;
}

function displayResiduals(root, left, right) {
	var move = {"name": "confusion-self-hit", "type": "curse", "power": 40};
	if (left && right) {
		var leftSelfHit = engine.getDamage(left, left, BattleMove.of(left, move, -1, false));
		var rightSelfHit = engine.getDamage(right, right, BattleMove.of(right, move, -1, false));
		document.getElementById("residual-damage").innerHTML = `
			<table>
				<tr>
					${residualRoll(left, leftSelfHit.max)}
					<td>Confusion self hit</td>
					${residualRoll(right, rightSelfHit.max)}
				</tr>
				<tr>
					${residualFractional(left, 1 / 16, residualToxicTooltip(left))}
					<td>
						<div class="residual-percent">6.25% (1/16)</div>
						Bind, Toxic, Leftovers, etc.
					</td>
					${residualFractional(right, 1 / 16, residualToxicTooltip(right))}
				</tr>
				<tr>
					${residualFractional(left, 1 / 8)}
					<td>
						<div class="residual-percent">12.5% (1/8)</div>
						Poison, Burn, Sandstorm, Spikes, Leech Seed, etc.
					</td>
					${residualFractional(right, 1 / 8)}
				</tr>
			</table>
		`;
	}
}

function residualFractional(battlePoke, fraction, tooltip) {
	var base = Math.max(1, parseInt(getPokeStat(battlePoke.poke, "hp") * fraction));
	return residualRoll(battlePoke, base, tooltip);
}

function residualRoll(battlePoke, damage, tooltip) {
	var percent = toPercent(damage / getPokeStat(battlePoke.poke, "hp"));
	return `<td><ruby>${damage}<rt>${percent}%</rt></ruby>${orElse(tooltip, "")}</td>`;
}

function residualToxicTooltip(battlePoke) {
	var base = Math.max(1, parseInt(getPokeStat(battlePoke.poke, "hp") * (1 / 16)));
	var v = `<div class="rolls">Toxic Turns<table><tr>`;
	for (var i = 1; i < 17; i++) {
		var damage = base * i;
		var percent = Math.round(1000 * damage / getPokeStat(battlePoke.poke, "hp")) / 10;
		v += `<td><ruby>${damage}<rt>${percent}%</rt></ruby></td>`;
		if ((i) % 4 == 0) {
			v += `</tr><tr>`;
		}
	}
	v += `</tr></table></div>`;
	return v;
}

function displayCalcStat(div, battlePoke, stat) {
	var s = battlePoke.getEffectiveStat(stat);
	div.getElementsByClassName("stat-num")[0].innerHTML = s;
	//div.getElementsByClassName("stat-num")[0].innerHTML = "<ruby>" + s + "<rt>" + o + "</rt></ruby>";
}

function displayPokemon(root, i) {
	var p = pokemonByPokedex.get(i);
	root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(p);
	root.getElementsByClassName("poke-dex-num")[0].innerHTML = "#" + padNumber(p.pokedex);
	root.getElementsByClassName("poke-icon")[0].innerHTML = '<img draggable="false" src="' + getPokeImage(p) + '">';
	var types = prettyType(p.types[0]);
	if (p.types.length > 1) {
		types += " " + prettyType(p.types[1]);
	}
	root.getElementsByClassName("poke-types")[0].innerHTML = types;
	displayStat(root.getElementsByClassName("poke-hp")[0], p.stats.hp);
	displayStat(root.getElementsByClassName("poke-atk")[0], p.stats.atk);
	displayStat(root.getElementsByClassName("poke-def")[0], p.stats.def);
	displayStat(root.getElementsByClassName("poke-spa")[0], p.stats.spa);
	displayStat(root.getElementsByClassName("poke-spd")[0], p.stats.spd);
	displayStat(root.getElementsByClassName("poke-spe")[0], p.stats.spe);
	if (p.abilities && p.abilities.length == 3) {
		var abil = `<table>
			<tr>
				<td>${fullCapitalize(p.abilities[0])}</td>
				<td>${fullCapitalize(p.abilities[1])}</td>
			</tr>
			<tr>
				<td colspan="2">${fullCapitalize(p.abilities[2])}</td>
			</tr>
		</table>`;
		root.getElementsByClassName("poke-abilities")[0].innerHTML = abil;
	}
	if (p.gender.startsWith("f")) {
		var female = parseFloat(p.gender.substring(1));

		var m = parseInt(female * 16 / 100);
		document.getElementsByClassName("poke-genders")[0].innerHTML =
			'<div class="h6">Gender '
			+ '<div class="gender-bar" style="background: '
			+ 'linear-gradient(90deg, var(--gender-female) 0%, var(--gender-female) '
			+ female + '%, var(--gender-male) ' + female + '%, var(--gender-male) 100%)">'
			+ '</div></div>'
			+ '<div class="rolls"><center>' + m + ' Female, ' + (16 - m) + ' Male</center></div>';
	} else {
		document.getElementsByClassName("poke-genders")[0].innerHTML =
			'<div class="h6">Gender <div class="gender-bar unknown-gender"></div></div>'
			+ '<div class="rolls"><center>Unknown</center></div>';
	}
	var items = "";
	if (p.items.length > 0) {
		items = "<h6>Wild Held Items</h6>";
		for (var i = 0; i < p.items.length; i++) {
			items += `<div>${itemLink(p.items[i].item)} ${p.items[i].chance * 100}%`;
		}
	}
	document.getElementsByClassName("poke-items")[0].innerHTML = items;
	var evo = "<h6>Evolutions</h6>";
	for (let index in data.pokemon) {
		var v = data.pokemon[index];
		if (!v.evolutions) {
			continue;
		}
		for (var i = 0; i < v.evolutions.length; i++) {
			var evolution = v.evolutions[i];
			if (evolution.into != p.name) {
				continue;
			}
			var before;
			if (evolution.method == "item") {
				before = itemLink(evolution.item);
			} else if (evolution.method == "level") {
				before = "Level " + evolution.level;
			} else if (evolution.method == "hitmonlee" || evolution.method == "hitmonchan" || evolution.method == "hitmontop") {
				before = "Level 25";
			} else {
				before = evolution.method;
			}
			evo += "<div>" + pokeLink(v.name) + " -> " + before + "</div>"
		}
	}
	if (p.evolutions) {
		for (var i = 0; i < p.evolutions.length; i++) {
			var evolution = p.evolutions[i];
			var before;
			if (evolution.method == "item") {
				before = itemLink(evolution.item);
			} else if (evolution.method == "level") {
				before = "Level " + evolution.level;
			} else if (evolution.method == "hitmonlee" || evolution.method == "hitmonchan" || evolution.method == "hitmontop") {
				before = "Level 25";
			} else {
				before = evolution.method;
			}
			evo += "<div>" + before + " -> " + pokeLink(evolution.into) + "</div>"
		}
	}
	if (evo != "<h6>Evolutions</h6>") {
		root.getElementsByClassName("poke-evolution")[0].innerHTML = evo;
	} else {
		root.getElementsByClassName("poke-evolution")[0].innerHTML = "";
	}

	root.getElementsByClassName("poke-tabs")[0].innerHTML = selectTabInDisplay(`
	<div class="tab-collection">
		<div class="tab-header">
			<div class="tab-button" onclick="selectTab(event)">Learnset</div>
			<div class="tab-button" onclick="selectTab(event)">TM/HM</div>
			<div class="tab-button" onclick="selectTab(event)">Encounters</div>
			<div class="engine-flag-statistics tab-button" onclick="selectTab(event)">Statistics</div>
		</div>
		<div class="scroll-padding-anchor"></div>
		<div class="tab-body">
			<div class="tab-contents">${getPokemonLearnsetDisplay(p)}</div>
			<div class="tab-contents">${getPokemonTmHmDisplay(p)}</div>
			<div class="tab-contents">${getPokemonEncountersDisplay(p)}</div>
			<div class="engine-flag-statistics tab-contents">${getPokemonStatsDisplay(p)}</div>
		</div>
	</div>`, 0);
}

function updateCalc() {
	try {
		displayCalcPokemon(document.getElementById("player"), myPoke, theirPoke, false);
		displayCalcPokemon(document.getElementById("opponent"), theirPoke, myPoke, true);
		var v = "";
		for (var i = 0; i < box.length && i < box.length; i++) {
			var img = '<img draggable="false" src="' + getPokeImage(box[i]) + '">';
			v += '<div class="micro-mon drag-sortable" onclick="setPlayer(' + i + ')">' + img + "</div>";
		}
		document.getElementById("player").getElementsByClassName("calc-team")[0].innerHTML = v;
		document.getElementById("opponent").getElementsByClassName("calc-team")[0].innerHTML = getEnemyTeamDisplay(enemyTeam, lastTrainer);
		var extraTrainers = "";
		for (var i = lastTrainer + 1; isTrainerB2b(i); i++) {
			extraTrainers += `<div class="calc-team">${getEnemyTeamDisplay(data.trainers[i].team, i)}</div>`;
			extraTrainers += `<div class="calc-navigation"><span>${getTrainerName(data.trainers[i].name)} </span>`;
			extraTrainers += createLink(`#/trainer/${data.trainers[i].name}/`, `<button>Info</button>`) + " ";
			extraTrainers += `<button disabled=true onclick="navigateBattle(-1)">Previous</button> `;
			extraTrainers += `<button disabled=true onclick="navigateBattle(1)">Next</button> `;
			extraTrainers += `</div>`
		}
		i--; // last trainer of the gauntlet
		if (data.trainers[i].meta != undefined) {
			extraTrainers += `<div style="padding-top:10px;">${data.trainers[i].meta}</div>`;
		}
		document.getElementById("opponent").getElementsByClassName("extra-calc-teams")[0].innerHTML = extraTrainers;
	} catch(e) {
		console.log(e);
	}
}

function getEnemyTeamDisplay(enemyTeam, trainer) {
	var v = "";
	for (let i in enemyTeam) {
		var prioClass = ["low", "neutral", "high"][Math.sign(getSwitchPriority(enemyTeam[i], myPoke)) + 1];
		var img = `<img draggable="false" class="${prioClass}-switch-priority" src="${getPokeImage(enemyTeam[i])}">`;
		v += `<div class="micro-mon" onclick="setEnemy(${trainer}, ${i})">${img}</div>`;
	}
	return v;
}

function getPokemonLearnsetDisplay(p) {
	return `
		<table class="move-table">
			${p.learnset.displayMap(m => getMoveDisplay(movesByName.get(m.move), m.level))}
		</table>
	`;
}

function getPokemonTmHmDisplay(p) {
	return `
		<table class="move-table">
			${p.tmhm.displayMap(m => getMoveDisplay(movesByName.get(m)))}
		</table>
	`;
}

function getPokemonEncountersDisplay(p) {
	var encounters = getRelativeEncounterChances(p.name);
	if (encounters) {
		var v = "<table class='poke-encounters'>";
		for (const en of Object.entries(encounters)) {
			var area = en[0];
			if (caughtLandmarks.has(landmarksByLocation.get(area).name)) {
				v += `<tr class="poke-encounters-dupe">`;
			} else {
				v += "<tr>";
			}
			v += "<td>"	+ areaLink(area) + "</span></td>";
			for (const el of Object.entries(en[1])) {
				var type = el[0];
				var chances = el[1];
				v += "<td>";
				v += `<img style="display:inline;" src="${encounterIcons.get(type)}">`;
				v += `<span class="poke-encounters-percentage">`
				if (chances.base != chances.dupe) {
					v += `<ruby>${chances.base}%<rt>(${chances.dupe}%)</rt></ruby>`;
				} else {
					v += `${chances.base}%`;
				}
				v += "</span></td>";
			}
			v += "</tr>";
		}
		v += "</table>"
		return v;
	}
	return "";
}

function getPokemonStatsDisplay(p) {
	var usageLines = "";
	var usagePoints = "";

	var hTotal = data.trainers.length;
	for (var i = 0; i < data.trainers.length; i++) {
		var t = data.trainers[i];
		var b = bringsByTrainer.get(t.name);
		var usage = 0;
		if (b && b.brings.has(p.name)) {
			usage = b.brings.get(p.name) * 100 / b.total;
		}
		var trainerName = getTrainerName(t.name);
		if (t.name.startsWith("champion-")) {
			usageLines += createLink(`#/trainer/${t.name}/`, `<div class="poke-statistics-line e4r1" style="left:calc(2px + ${i * 100 / hTotal}%)"><div class="rolls"><center>${trainerName}</center></div></div>`);
		}
		if (t.name.startsWith("leader-")) {
			usageLines += createLink(`#/trainer/${t.name}/`, `<div class="poke-statistics-line" style="left:calc(2px + ${i * 100 / hTotal}%)"><div class="rolls"><center>${trainerName}</center></div></div>`);
		}
		usagePoints += createLink(`#/trainer/${t.name}/`, `<div class="usage-point" style="left:${i * 100 / hTotal}%;bottom:${usage}%;"><div class="rolls"><center>${trainerName}</center></div></div>`);
	}

	return `
	<div class="engine-flag-statistics poke-usage-statistics">
		<div class="poke-usage-statistics-inner"">${usageLines}${usagePoints}</div>
	</div>`;
}

function displayStat(div, stat) {
	div.getElementsByClassName("stat-num")[0].innerHTML = "" + stat;
	if (stat > 255) {
		stat = 255;
	}
	var full = div.getElementsByClassName("full-stat-bar")[0];
	full.style.width = (stat * 100 / 255) + "%";
	var rating = "amazing";
	if (stat < 40) {
		rating = "terrible"
	} else if (stat < 90) {
		rating = "mediocre"
	} else if (stat < 120) {
		rating = "decent"
	} else if (stat < 150) {
		rating = "great"
	}
	full.style.backgroundColor = "var(--stat-bar-fill-" + rating + ")";
}

function getFullItemDisplay(item) {
	var v = "<h3>" + itemImage(item) + fullCapitalize(item) + "</h3>";
	var it = itemsByName.get(item);
	v += "<p>" + it.description + "</p>"
	var locs = landmarksByItem.get(item);
	if (locs) {
		v += "<p>Locations:</p>";
		for (var i = 0; i < locs.length; i++) {
			var loc = locs[i];
			for (var j = 0; j < loc.items.length; j++) {
				if (loc.items[j].item == item) {
					v += "<div>" + landmarkLink(loc) + ":</div>";
					v += getItemLocationDescription(loc.items[j]) + "<br>";
				}
			}
		}
	}
	if (pokemonByItem.has(item)) {
		var list = pokemonByItem.get(item);
		v += "<p>Wild Held Item (" + list.length + "):</p>";
		v += '<div class="learnset-pool">'
		for (var i = 0; i < list.length; i++) {
			v += getEncounterPoke(list[i].pokemon, list[i].chance * 100 + "%");
		}
		v += '</div>';
	}
	return v;
}

function getItemLocationDescription(desc) {
	return `
		<div>${itemLink(desc.item)} ${desc.amount}</div>
		<div>${desc.info}</div>
	`;
}

function getFullMoveDisplay(move) {
	var byLearnset = movesByLearnset.get(move.name);
	var byTMHM = movesByTMHM.get(move.name);
	return `
		<h3>${getMoveName(move.name)}</h3>
		${move.extra ?
			move.extra.displayMap(e => `<p>${e.split("\n").displayMap(l => `<div>${l}</div>`)}</p>`)
		: ""}
		<div>
			<table>
				${getMoveDisplay(move)}
			</table>
		</div>
		${byLearnset ? `
			<p>By Learnset (${byLearnset.length}):</p>
			<div class="learnset-pool">
				${byLearnset.displayMap(e => getEncounterPoke(e.pokemon, `Lvl ${e.level}`))}
			</div>
		` : ""}
		${byTMHM ? `
			<p>By TMHM (${byTMHM.length}):</p>
			<div class="learnset-pool">
				${byTMHM.displayMap(p => getEncounterPoke(p))}
			</div>
		` : ""}
	`;
}

function getMoveDisplay(move, level = undefined) {
	return `
		<tr>
			${level != undefined ? `<td>${level}</td>` : ``}
			<td>${prettyType(move.type)}</td>
			<td>${moveLink(move.name)}</td>
			<td>${move.power == 0 ? "-" : move.power}</td>
			<td>${move.accuracy}%</td>
			<td>${move.pp}pp</td>
			${(move.extra && move.extra.length > 0) ? `<td class="extra-info" title="${move.extra.join("")}">?</td>` : ""}
		</tr>
	`;
}

function getFullTypeDisplay(type) {
	return selectTabInDisplay(`
	${prettyType(type)}
	<div class="tab-collection">
		<div class="tab-header">
			<div class="tab-button" onclick="selectTab(event)">Pokemon</div>
			<div class="tab-button" onclick="selectTab(event)">Moves</div>
		</div>
		<div class="scroll-padding-anchor"></div>
		<div class="tab-body">
			<div class="tab-contents">
				<div class="learnset-pool">
					${data.pokemon.filter(p => p.types.contains(type)).displayMap(p => getEncounterPoke(p))}
				</div>
			</div>
			<div class="tab-contents">
				<table class="move-table">
					${data.moves.filter(m => m.type == type).displayMap(m => getMoveDisplay(m))}
				</table>
			</div>
		</div>
	</div>`, 0);
}

function getEncounterPoke(poke, header, footer, extraClasses) {
	if (!poke.types) {
		poke = pokemonByName.get(poke);
	}
	return `
		<div class="encounter-poke${extraClasses ? " " + extraClasses : ""}">
			${orElse(header, "")}
			${createLink(`#/pokemon/${poke.name}/`, '<img draggable="false" src="' + getPokeImage(poke.name) + '">')}
			${orElse(footer, "")}
			<div class="type-slices">
				${poke.types.displayMap(t => customLink(`#/type/${t}/`, `class="type-slice" style="background-color: ${typeColor(t)};"`, ""))}
			</div>
		</div>
	`;
}

function setMap(xOffset = undefined, yOffset = 0, scale = 48) {
	if (xOffset == undefined) {
		xOffset = orElse(savedData["last-map"], 0);
	}
	savedData["last-map"] = xOffset;
	writeLocalStorage();
	var th = 17 * scale;
	var v = "";
	v += '<button onclick="setMap(0)">Johto</button>';
	v += '<button onclick="setMap(-17)">Kanto</button>';
	v += getMapDisplay(960, th, xOffset, yOffset, scale);
	document.getElementById("map").innerHTML = v;
}

function getMapDisplay(width, height, xOffset = 0, yOffset = 0, scale = 48, focus = "") {
	var border = parseInt(scale / 8);
	var xo = xOffset * scale;
	var yo = yOffset * scale;
	var v = "";
	v += '<div class="minimap" style="width:' + width + 'px;height:' + height + 'px;">';
	for (var i = 0; i < data.landmarks.length; i++) {
		var lc = data.landmarks[i];
		var cl = "";
		if (lc.name.startsWith("route")) {
			cl = "landmark-route";
		} else if (lc.name.includes("city") || lc.name.includes("town")) {
			cl = "landmark-town";
		}

		if (caughtLandmarks.has(lc.name)) {
			cl += " landmark-caught";
		}

		if (lc.name == focus) {
			cl += " landmark-focused";
		}

		for (var j = 0; j < lc.positions.length; j++) {
			var l = lc.positions[j];
			var x = l.x * scale + xo;
			var y = l.y * scale + yo;
			if (x !== 0 && !x) {
				continue;
			}
			var width = scale;
			var height = scale;
			if (l.width) {
				width = l.width * scale;
			}
			if (l.height) {
				height = l.height * scale;
			}
			width -= border * 2;
			height -= border * 2;
			v += createLink(`#/area/${lc.locations[0]}`, '<div class="landmark ' + cl + '" style="left:' + x + 'px;top:' + y + 'px;width:' + width + 'px;height:' + height + 'px;border-width:' + border + 'px;"></div>');
		}
	}
	v += "</div>";
	return v;
}

function getMapCenter(landmark) {
	var xo = 0;
	var yo = 0;
	for (var j = 0; j < landmark.positions.length; j++) {
		var width = landmark.positions[j].width;
		var height = landmark.positions[j].height;
		if (width == undefined) {
			width = 1;
		}
		if (height == undefined) {
			height = 1;
		}
		xo += landmark.positions[j].x + width / 2;
		yo += landmark.positions[j].y + height / 2;
	}
	xo /= landmark.positions.length;
	yo /= landmark.positions.length;
	return {x: xo, y: yo};
}

function updateBox() {
	var v = ``;
	for (var i = 0; i < box.length; i++) {
		v += getTinyPokemonDisplay(box[i],
			`<div>
				<button onclick="editBox(${i})">Edit</button>
				<button onclick="moveToBoxStart(${i})">Move to Start</button>
				<button onclick="calcFromBox(${i})">Calc Vs</button>
				<button onclick="removeFromBox(${i})">Delete</button>
			</div>`);
	}
	document.getElementById("box-pokes").innerHTML = v;
	savedData["box"] = box;
	savedData["dead-box"] = deadBox;
	writeLocalStorage();
	caughtLandmarks.clear();
	for (var i = 0; i < box.length; i++) {
		caughtLandmarks.add(box[i].caught);
	}
	for (var i = 0; i < deadBox.length; i++) {
		caughtLandmarks.add(deadBox[i].caught);
	}
	updateCalc();
}

function clearPlayerStages() {
	playerMoveVariants = [-1, -1, -1, -1];
	document.getElementById("player").getElementsByClassName("status-select")[0].value = "none";
	var inputs = document.getElementsByClassName("player-stages");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].value = "0";
	}
	document.getElementsByClassName("player-current-hp")[0].value = "";
	updateCalc();
}

function clearEnemyStages() {
	enemyMoveVariants = [-1, -1, -1, -1];
	document.getElementById("opponent").getElementsByClassName("status-select")[0].value = "none";
	var inputs = document.getElementsByClassName("enemy-stages");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].value = "0";
	}
	document.getElementsByClassName("enemy-current-hp")[0].value = "";
	updateCalc();
}

function setMoveVariant(player, move, variant) {
	if (player) {
		if (playerMoveVariants[move] == variant) {
			playerMoveVariants[move] = -1;
		} else {
			playerMoveVariants[move] = variant;
		}
	} else {
		if (enemyMoveVariants[move] == variant) {
			enemyMoveVariants[move] = -1;
		} else {
			enemyMoveVariants[move] = variant;
		}
	}
	updateCalc();
}

function openMenu(name) {
	var el = document.getElementById(name);
	if (!el.classList.contains("visible-selection-menu")) {
		var init = el.getAttribute("menu-init");
		if (init) {
			eval(init);
		}
		el.classList.add("visible-selection-menu");
		menuOpen = Date.now();
	}
}

document.onclick = function(event) {
	if (OptionSelect.lastClickInside || event.target.parentElement == null || event.target.closest("#option-select") || (event.target && event.target.classList && event.target.classList.contains("option-list-option"))) {
		return;
	}
	if (Math.abs(menuOpen - Date.now()) > 30) {
		for (let el of document.getElementsByClassName("visible-selection-menu")) {
			if (el.contains(event.target) && el.id != "item-menu") {
				return;
			}
			if (el && el.classList) {
				el.classList.remove("visible-selection-menu")
			}
		}
	}
}

document.getElementById("player-current-level").oninput = function(event) {
	var lvl = parseInt(document.getElementById("player-current-level").value);
	if (lvl > 0) {
		myPoke.level = lvl;
	}
	updateCalc();
	updateBox();
}

function selectTab(event) {
	var headers = event.target.parentElement;
	var index = 0;
	var i = 0;
	for (const p of headers.getElementsByClassName("tab-button")) {
		if (p === event.target) {
			index = i;
			p.classList.add("selected-tab-button");
		} else {
			p.classList.remove("selected-tab-button");
		}
		i++;
	}
	i = 0;
	for (const p of headers.parentElement.getElementsByClassName("tab-contents")) {
		if (i == index) {
			p.style.display = "block";
		} else {
			p.style.display = "none";
		}
		i++;
	}
	updateLinkState();
}

function setItemMenu() {
	var handyItems = [
		"blackbelt",
		"sharp-beak",
		"poison-barb",
		"soft-sand",
		"hard-stone",
		"silverpowder",
		"spell-tag",
		"metal-coat",
		"charcoal",
		"mystic-water",
		"miracle-seed",
		"magnet",
		"twistedspoon",
		"nevermeltice",
		"dragon-fang",
		"blackglasses",
		"pink-bow",
		"quick-claw",
		"kings-rock",
		"thick-club",
		"metal-powder",
		"berry",
		"berry-juice",
		"gold-berry",
		"przcureberry",
		"mint-berry",
		"psncureberry",
		"ice-berry",
		"burnt-berry",
		"bitter-berry",
		"mysteryberry",
		"miracleberry",
	];
	var v = `<table><tr>`;
	for (var i = 0; i < handyItems.length; i++) {
		v += `<td style="cursor:pointer;" onclick="setPlayerItem('${handyItems[i]}')">${itemImage(handyItems[i])}</td>`;
		if ((i + 1) % 8 == 0 && i + 1 < handyItems.length) {
			v += `</tr><tr>`;
		}
	}
	v += `</tr></table>`;
	document.getElementById("item-menu").innerHTML = v;
}

function setEngineDisplayFlags(enabled) {
	var flags = ["dvs", "evs", "nature", "ability", "statistics"];
	var sheet = document.getElementById("dynamic-style");
	var content = "";
	for (const flag of flags) {
		if (!enabled.contains(flag)) {
			content += `
				.engine-flag-${flag} {
					display: none;
				}
			`;
		}
	}
	sheet.textContent = content;
}
