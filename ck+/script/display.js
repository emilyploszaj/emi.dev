var menuOpen;

function displayCalcPokemon(root, poke, opponent, right) {
	var player = !right;
	var p = pokemonByName.get(poke.name);

	root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(p);
	if (poke.transformStats) {
		root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(pokemonByName.get("ditto"));
	}
	root.getElementsByClassName("poke-level")[0].innerHTML = "Lvl " + poke.level;
	root.getElementsByClassName("poke-item")[0].innerHTML = itemLink(poke.item);
	root.getElementsByClassName("poke-icon")[0].innerHTML = '<img src="' + getPokeImage(poke) + '">';
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
	var myStages = "player-stages";
	var theirStages = "enemy-stages";
	if (!player) {
		myStages = "enemy-stages";
		theirStages = "player-stages";
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
		if (status == "brn" || status == "psn") {
			var dealt = Math.max(1, parseInt(myHp / 8));
			root.getElementsByClassName("status-info")[0].innerHTML = dealt + "";
		} else if (status == "tox") {
			var inner = "<h1>Toxic Damage</h1>"
			var base = parseInt(myHp / 16);
			for (var i = 1; i <= 20; i++) {
				inner += '<p>Turn ' + i + ': ' + Math.max(1, base * i) + ' HP</p>';
			}
			root.getElementsByClassName("status-info")[0].innerHTML = '<span>' + base + 'n<div class="rolls"><center>' + inner + '</center></div></span>';
		} else if (status == "cnf") {
			var move = {"name": "confusion-self-hit", "type": "curse", "power": 40}
			var max = getDamage(poke, poke, getStages(myStages), getStages(myStages), move, player, false, false);
			var maxPercent = Math.round(1000 * max / getPokeStat(poke, "hp")) / 10;
			var desc = `<span>${max}</span>`;
			root.getElementsByClassName("status-info")[0].innerHTML = desc;
		} else {
			root.getElementsByClassName("status-info")[0].innerHTML = "";
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

	displayCalcStat(root.getElementsByClassName("calc-hp")[0], poke, "hp");
	displayCalcStat(root.getElementsByClassName("calc-atk")[0], poke, "atk");
	displayCalcStat(root.getElementsByClassName("calc-def")[0], poke, "def");
	displayCalcStat(root.getElementsByClassName("calc-spa")[0], poke, "spa");
	displayCalcStat(root.getElementsByClassName("calc-spd")[0], poke, "spd");
	displayCalcStat(root.getElementsByClassName("calc-spe")[0], poke, "spe", player);
	if (opponent) {
		var mySpe = getModifiedStat(poke, getStages(myStages), "spe");
		var theirSpe = getModifiedStat(opponent, getStages(theirStages), "spe");
		if (badges >= speedBadges) {
			if (hasBadgeBoost(poke, player)) {
				mySpe = parseInt(mySpe * 1.125);
			}
			if (hasBadgeBoost(opponent, !player)) {
				theirSpe = parseInt(theirSpe * 1.125);
			}
		}
		if (status == "prz") {
			mySpe = parseInt(mySpe / 4);
		}
		if (enemyStatus == "prz") {
			theirSpe = parseInt(theirSpe / 4);
		}
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
	for (var i = 0; i < 4; i++) {
		if (i < poke.moves.length) {
			var p1 = `<td class="move-calc">${moveLink(poke.moves[i])}</td>`;
			var move = movesByName.get(poke.moves[i]);
			var min = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, false, true);
			var max = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, false, false);
			var rolls = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, false, false, true);
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = "";
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra += ' ohko';
			} else if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra += ' thko';
			}
			var p2 = moveDisplay(min, max, minPercent, maxPercent, extra, prettyRolls(rolls, myHp, myCurrentHp, opponentCurrentHp, move.effects), move.power)
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
			var min = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, true, true);
			var max = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, true, false);
			var rolls = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, true, false, true);
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = " crit";
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra += ' ohko';
			} else if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra += ' thko';
			}
			var p3 = moveDisplay(min, max, minPercent, maxPercent, extra, prettyRolls(rolls, myHp, myCurrentHp, opponentCurrentHp, move.effects), move.power);
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
}

function moveDisplay(min, max, minPercent, maxPercent, classes, tooltip, power) {
	var v = `<td class="move-calc ${classes}"><ruby>${min} - ${max}<rt>${minPercent}% - ${maxPercent}%</rt></ruby>${tooltip}</td>`;
	if (max == 0 && power == 0) {
		v = '<td class="move-calc"><ruby><rt>​</rt></ruby></td>';
	}
	return v;
}

function prettyRolls(rolls, myHp, myCurrentHp, killHp, effects) {
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
	if (effects) {
		if (effects.recoil > 0) {
			var min = parseInt(Math.min(killHp, rolls[0]) * effects.recoil);
			var max = parseInt(Math.min(killHp, rolls[rolls.length - 1]) *effects.recoil);
			var minPercent = Math.round(1000 * min / myHp) / 10;
			var maxPercent = Math.round(1000 * max / myHp) / 10;
			var extra = "";
			if (max >= myCurrentHp) {
				extra = "ohko";
			}
			v += "<h1>Recoil:</h1>";
			v += `<table><tr>${moveDisplay(min, max, minPercent, maxPercent, extra, "", -1)}</tr></table>`;
		}
		if (effects.drain > 0) {
			var min = parseInt(Math.min(killHp, rolls[0]) * effects.drain);
			var max = parseInt(Math.min(killHp, rolls[rolls.length - 1]) * effects.drain);
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

function displayCalcStat(div, poke, stat, player = false) {
	var s = getPokeStat(poke, stat);
	var o = s;
	if (badges >= speedBadges && stat == "spe") {
		if (hasBadgeBoost(poke, player)) {
			s = parseInt(s * 1.125);
		}
		div.getElementsByClassName("stat-num")[0].innerHTML = "<ruby>" + s + "<rt>" + o + "</rt></ruby>";
	} else {
		div.getElementsByClassName("stat-num")[0].innerHTML = s;
	}
}

function displayPokemon(root, i) {
	var p = data.pokemon[i];
	root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(p);
	root.getElementsByClassName("poke-dex-num")[0].innerHTML = "#" + padNumber(p.pokedex);
	root.getElementsByClassName("poke-icon")[0].innerHTML = '<img src="' + getPokeImage(p) + '">';
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
			<div class="tab-button" onclick="selectTab(event)">Statistics</div>
		</div>
		<div class="scroll-padding-anchor"></div>
		<div class="tab-body">
			<div class="tab-contents">${getPokemonLearnsetDisplay(p)}</div>
			<div class="tab-contents">${getPokemonTmHmDisplay(p)}</div>
			<div class="tab-contents">${getPokemonEncountersDisplay(p)}</div>
			<div class="tab-contents">${getPokemonStatsDisplay(p)}</div>
		</div>
	</div>`, 0);
}

function getPokemonLearnsetDisplay(p) {
	var v = "";
	v += '<table class="move-table">';
	for (let mi in p.learnset) {
		var m = p.learnset[mi];
		v += getMoveDisplay(movesByName.get(m.move), m.level);
	}
	v += "</table>";
	return v;
}

function getPokemonTmHmDisplay(p) {
	var v = "";
	v += '<table class="move-table">';
	for (let mi in p.tmhm) {
		var m = p.tmhm[mi];
		v += getMoveDisplay(movesByName.get(m));
	}
	v += "</table>";
	return v;
}

function getPokemonEncountersDisplay(p) {
	var encounters = pokemonEncounters.get(p.name);
	if (encounters) {
		var v = "";
		for (const en of encounters.entries()) {
			var area = en[0];
			var parts = en[1];
			v += "<div>";
			v += "<span class=\"poke-link\" onclick=\"focusEncounter(" + encountersByName.get(area) + ")\">"
				+ fullCapitalize(area) + "</span> - ";
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				v += "<span>";
				v += part.chance + "%";
				v += "</span> ";
			}
			v += "</div>";
		}
		return v;
	} else {
		return "";
	}
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
		if (t.name == "Champion CHAMPION (1) LANCE") {
			usageLines += `<div class="poke-statistics-line e4r1" onclick="focusTrainer(${i})" style="left:calc(2px + ${i * 100 / hTotal}%)"><div class="rolls"><center>${trainerName}</center></div></div>`;
		}
		if (statisticsSplits.has(t.name)) {
			usageLines += `<div class="poke-statistics-line" onclick="focusTrainer(${i})" style="left:calc(2px + ${i * 100 / hTotal}%)"><div class="rolls"><center>${trainerName}</center></div></div>`;
		}
		usagePoints += `<div class="usage-point" onclick="focusTrainer(${i})" style="left:${i * 100 / hTotal}%;bottom:${usage}%;"><div class="rolls"><center>${trainerName}</center></div></div>`;
	}

	return `
	<div class="poke-usage-statistics">
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
	var v = "<h3>" + `<img class="item-icon" src="./images/items/${item.replace("-", "_")}.png">` + fullCapitalize(item) + "</h3>";
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
			v += '<div class="encounter-poke">';
			v += list[i].chance * 100 + "%";
			v += '<img style="cursor:pointer;" onclick="focusPokeByName(\'' + list[i].pokemon
				+ '\')" src="' + getPokeImage(list[i].pokemon) + '">';
			v += '</div>';
		}
		v += '</div>';
	}
	return v;
}

function getItemLocationDescription(desc) {
	var l = "<div>";
	l += itemLink(desc.item) + " " + desc.amount;
	l += "</div>";
	l += "<div>";
	l += desc.info;
	l += "</div>";
	return l;
}

function getFullMoveDisplay(move) {
	var v = "<h3>" + getMoveName(move.name) + "</h3>";
	if (move.extra) {
		for (var i = 0; i < move.extra.length; i++) {
			v += "<p>";
			var me = move.extra[i].split("\n");
			for (var i = 0; i < me.length; i++) {
				v += "<div>";
				v += me[i];
				v += "</div>";
			}
			v += "</p>";
		}
	}
	v += "<div><table>";
	v += getMoveDisplay(move);
	v += "</table></div>";
	if (movesByLearnset.has(move.name)) {
		var list = movesByLearnset.get(move.name);
		v += "<p>By Learnset (" + list.length + "):</p>";
		v += '<div class="learnset-pool">'
		for (var i = 0; i < list.length; i++) {
			v += '<div class="encounter-poke">';
			v += " Lvl " + list[i].level;
			v += '<img style="cursor:pointer;" onclick="focusPokeByName(\'' + list[i].pokemon
				+ '\')" src="' + getPokeImage(list[i].pokemon) + '">';
			v += '</div>';
		}
		v += '</div>';
	}
	if (movesByTMHM.has(move.name)) {
		var list = movesByTMHM.get(move.name);
		v += "<p>By TMHM (" + list.length + "):</p>";
		v += "<div>";
		for (var i = 0; i < list.length; i++) {
			v += '<div class="learnset-pool">'
			for (var i = 0; i < list.length; i++) {
				v += '<div class="encounter-poke">';
				v += '<img style="cursor:pointer;" onclick="focusPokeByName(\'' + list[i]
					+ '\')" src="' + getPokeImage(list[i]) + '">';
				v += '</div>';
			}
			v += '</div>';
		}
		v += '</div>';
	}
	return v;
}

function getMoveDisplay(move, level = undefined) {
	var v = '<tr>';
	if (level != undefined) {
		v += '<td>' + level + '</td>';
	}
	v += '<td>' + prettyType(move.type) + '</td>';
	v += '<td>' + moveLink(move.name) + '</td>';
	if (move.power == 0) {
		v += '<td>-</td>';
	} else {
		v += '<td>' + move.power + '</td>';
	}
	v += '<td>' + move.accuracy + '%</td>';
	v += '<td>' + move.pp + 'pp</td>';
	if (move.extra && move.extra.length > 0) {
		var alt = "";
		for (var i = 0; i < move.extra.length; i++) {
			alt += move.extra[i];
		}
		v += '<td class="extra-info" title="' + alt + '">?</td>';
	} else {
		v += '<td></td>';
	}
	v += '</tr>';
	return v;
}

function setMap(xOffset = 0, yOffset = 0, scale = 48) {
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
			v += '<div onclick=focusLandmark(' + lc.id + ') class="landmark ' + cl + '" style="left:' + x + 'px;top:' + y + 'px;width:' + width + 'px;height:' + height + 'px;border-width:' + border + 'px;"></div>';
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

function updateSearch(v) {
	v = v.toLowerCase();
	var res = "";
	var amount = 0;
	if (v.length > 0) {
		for (const n of searchResults.entries()) {
			if (n[0].includes(v)) {
				res += '<div class="search-suggestion" onmousedown="' + n[1] + '">' + fullCapitalize(n[0]) + '</div>';
				amount++;
				if (amount >= 12) {
					break;
				}
			}
		}
	}
	document.getElementById("search-suggestions").innerHTML = res;
}

function updateBox() {
	document.getElementById("box-pokes").innerHTML = "";
	for (var i = 0; i < box.length; i++) {
		document.getElementById("box-pokes").innerHTML += getTinyPokemonDisplay(box[i],
			'<div><button onclick="editBox(' + i + ')">Edit</button><button onclick="moveToBoxStart('
			+ i + ')">Move to Start</button><button onclick="calcFromBox('
			+ i + ')">Calc Vs</button><button onclick="removeFromBox('
			+ i + ')">Delete</button></div>');
	}
	localStorage.setItem("box", JSON.stringify(box));
	localStorage.setItem("dead-box", JSON.stringify(deadBox));
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
	document.getElementById("player").getElementsByClassName("status-select")[0].value = "none";
	var inputs = document.getElementsByClassName("player-stages");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].value = "0";
	}
	document.getElementsByClassName("player-current-hp")[0].value = "";
	updateCalc();
}

function clearEnemyStages() {
	document.getElementById("opponent").getElementsByClassName("status-select")[0].value = "none";
	var inputs = document.getElementsByClassName("enemy-stages");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].value = "0";
	}
	document.getElementsByClassName("enemy-current-hp")[0].value = "";
	updateCalc();
}

function openMenu(name) {
	var el = document.getElementById(name);
	if (!el.classList.contains("visible-selection-menu")) {
		el.classList.add("visible-selection-menu");
		menuOpen = Date.now();
	}
}

document.onclick = function(event) {
	if (Math.abs(menuOpen - Date.now()) > 30) {
		for (let el of document.getElementsByClassName("visible-selection-menu")) {
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
		"stick",
		"thick-club",
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