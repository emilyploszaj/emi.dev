var data;
var typeColors = new Map([
	["normal", "#a8a878"],
	["fire", "#f08030"],
	["water", "#6890f0"],
	["electric", "#f8d030"],
	["grass", "#78c850"],
	["ice", "#98d8d8"],
	["fighting", "#c03028"],
	["poison", "#a040a0"],
	["ground", "#e0c068"],
	["flying", "#a890f0"],
	["psychic", "#f85888"],
	["bug", "#a8b820"],
	["rock", "#b8a038"],
	["ghost", "#705898"],
	["dragon", "#7038f8"],
	["dark", "#705848"],
	["steel", "#b8b8d0"],
	["curse", "#68a090"]
]);
const NVE = 0.5;
const SE = 2;
const IMU = 0;
var specialTypes = new Set([
	"fire", "water", "electric", "grass", "ice", "psychic", "dragon", "dark"
]);
var typeMatchups = new Map();
var searchResults = new Map();
var pokemonByName = new Map();
var pokemonByPokedex = new Map();
var pokemonFamilies = new Map();
var encountersByName = new Map();
var pokemonEncounters = new Map();
var movesByName = new Map();
var movesByIndex = new Map();
var movesByLearnset = new Map();
var movesByTMHM = new Map();
var fishingPools = new Map();
var headbuttPools = new Map();
var rockPools = new Map();
var landmarksByIndex = new Map();
var landmarksByName = new Map();
var landmarksByLocation = new Map();
var myPoke;
var theirPoke;
var box = [];
var deadBox = [];
var enemyTeam = [];
var editing = -1;
var copyEditedMoves = false;
var badges = 0;
var lastTrainer = 17;
var editReturn;
var caughtLandmarks = new Set();
const attackBadges = 1;
const defenseBadges = 7;
const specialBadges = 6;
const speedBadges = 3;
const badgeTypes = new Map([
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
var typeEnhancements = new Map([
	["pink-bow", "normal"],
	["charcoal", "fire"],
	["mystic-water", "water"],
	["magnet", "electric"],
	["miracle-seed", "grass"],
	["nevermeltice", "ice"],
	["blackbelt", "fighting"],
	["poison-barb", "poison"],
	["soft-sand", "ground"],
	["sharp-beak", "flying"],
	["twistedspoon", "psychic"],
	["silverpowder", "bug"],
	["hard-stone", "rock"],
	["spell-tag", "ghost"],
	["dragon-fang", "dragon"],
	["blackglasses", "dark"],
	["metal-coat", "steel"]
]);
var itemsById = new Map([
	[0x03, "brightpowder"],
	[0x1e, "lucky-punch"],
	[0x23, "metal-powder"],
	[0x39, "exp-share"],
	[0x49, "quick-claw"],
	[0x4a, "psncureberry"],
	[0x4c, "soft-sand"],
	[0x4d, "sharp-beak"],
	[0x4e, "przcureberry"],
	[0x4f, "burnt-berry"],
	[0x50, "ice-berry"],
	[0x51, "poison-barb"],
	[0x52, "king's-rock"],
	[0x53, "bitter-berry"],
	[0x54, "mint-berry"],
	[0x58, "silver-powder"],
	[0x5b, "amulet-coin"],
	[0x5f, "mystic-water"],
	[0x60, "twistedspoon"],
	[0x62, "blackbelt"],
	[0x66, "blackglasses"],
	[0x68, "pink-bow"],
	[0x69, "stick"],
	[0x6b, "nevermeltice"],
	[0x6c, "magnet"],
	[0x6d, "miracleberry"],
	[0x70, "everstone"],
	[0x71, "spell-tag"],
	[0x75, "miracle-seed"],
	[0x76, "thick-club"],
	[0x77, "focus-band"],
	[0x7d, "hard-stone"],
	[0x7e, "lucky-egg"],
	[0x8a, "charcoal"],
	[0x8b, "berry-juice"],
	[0x8c, "scope-lens"],
	[0x8f, "metal-coat"],
	[0x90, "dragon-fang"],
	[0x92, "leftovers"],
	[0x96, "mysteryberry"],
	[0x97, "dragon-scale"],
	[0x98, "beserk-gene"],
	[0x98, "beserk-gene"],
	[0xa3, "light-ball"],
	[0xaa, "pokadot-bow"],
	[0xad, "berry"],
	[0xae, "gold-berry"],
]);
var trueNames = [
	"ThunderPunch",
	"ExtremeSpeed",
	"PoisonPowder",
	"ThunderShock",
	"DoubleSlap",
	"SelfDestruct",
	"DynamicPunch",
	"SonicBoom",
	"AncientPower",
	"DragonBreath",
	"HP Normal",
	"HP Fire",
	"HP Water",
	"HP Electric",
	"HP Grass",
	"HP Ice",
	"HP Fighting",
	"HP Poison",
	"HP Ground",
	"HP Flying",
	"HP Psychic",
	"HP Bug",
	"HP Rock",
	"HP Ghost",
	"HP Dragon",
	"HP Dark",
	"HP Steel",
	"BrightPowder",
	"PSNCureBerry",
	"PRZCureBerry",
	"TwistedSpoon",
	"BlackGlasses",
	"NeverMeltIce",
	"MiracleBerry",
	"MysteryBerry",
];
var nameFormatting = new Map();

var multiHitMoves = new Set([
	"barrage", "bone-rush", "comet-punch", "doubleslap",
	"fury-attack", "fury-swipes", "pin-missile", "spike-cannon"
]);
var doubleHitMoves = new Set([
	"bonemerang", "double-hit", "double-kick", "twineedle"
])

fetch("./data.json")
	.then(response => response.text())
	.then(text => {
		for (let i in trueNames) {
			var lower = trueNames[i].toLowerCase().replace(/-/g, " ");
			nameFormatting.set(lower, trueNames[i]);
		}
		var j = JSON.parse(text);
		for (let i in j.pokemon) {
			var p = j.pokemon[i];
			pokemonByName.set(p.name, p);
			pokemonByPokedex.set(p.pokedex, p);
			searchResults.set(p.name, 'focusPokemon(' + (p.pokedex) + ')');
		}
		var family = 0;
		for (let i in j.pokemon) {
			var p = j.pokemon[i]
			if (!pokemonFamilies.has(p.pokedex)) {
				addToFamily(p, family);
				family++;
			}
			for (var l = 0; l < p.learnset.length; l++) {
				var m = p.learnset[l];
				if (!movesByLearnset.has(m.move)) {
					movesByLearnset.set(m.move, []);
				}
				movesByLearnset.get(m.move).push({pokemon: p.name, level: m.level})
			}
			for (var l = 0; l < p.tmhm.length; l++) {
				var m = p.tmhm[l];
				if (!movesByTMHM.has(m)) {
					movesByTMHM.set(m, []);
				}
				movesByTMHM.get(m).push(p.name);
			}
		}
		for (let i in j.moves) {
			var m = j.moves[i];
			movesByName.set(m.name, m);
			if (m.index) {
				movesByIndex.set(m.index, m);
			}
			searchResults.set(m.name.replace(/-/g, " "), 'focusMove(' + (m.index) + ')');
		}
		for (let i in j.type_matchups) {
			var m = j.type_matchups[i];
			if (!typeMatchups.has(m.attacker)) {
				typeMatchups.set(m.attacker, new Map());
			}
			var map = typeMatchups.get(m.attacker);
			map.set(m.defender, m.multiplier);
		}
		for (let i in j.landmarks) {
			landmarksByIndex.set(j.landmarks[i].id, j.landmarks[i]);
			landmarksByName.set(j.landmarks[i].name, j.landmarks[i]);
			for (var k = 0; k < j.landmarks[i].locations.length; k++) {
				landmarksByLocation.set(j.landmarks[i].locations[k], j.landmarks[i]);
			}
		}
		for (let i in j.encounters) {
			var e = j.encounters[i];
			encountersByName.set(e.area, i);
			searchResults.set(e.area.replace(/-/g, " "), 'focusEncounter(' + i + ')');
		}
		for (let i in j.encounter_pools.fishing) {
			var p = j.encounter_pools.fishing[i];
			fishingPools.set(p.area, p);
		}
		for (let i in j.encounter_pools.headbutt) {
			var p = j.encounter_pools.headbutt[i];
			headbuttPools.set(p.area, p);
		}
		for (let i in j.encounter_pools.rock) {
			var p = j.encounter_pools.rock[i];
			rockPools.set(p.area, p);
		}
		for (let i in j.encounters) {
			addPoolInfo(j.encounters[i]);
		}
		enemyTeam = j.trainers[17].team;
		if (localStorage.getItem("last-trainer")) {
			var lt = parseInt(localStorage.getItem("last-trainer"));
			if (lt >= 0 && lt < j.trainers.length) {
				enemyTeam = j.trainers[lt].team;
				lastTrainer = lt;
				document.getElementById("current-trainer-name").innerHTML = j.trainers[lastTrainer].name;
			}
		}
		data = j;
		var a = j.trainers[17].team[2];
		var b = enemyTeam[0];
		myPoke = a;
		if (box.length > 0) {
			myPoke = box[0];
		}
		theirPoke = b;
		updateCalc();
		updateBox();
		displayTrainers();
		if (box.length > 0) {
			setTab("calc");
		} else {
			setTab("box");
		}
	});

function addToFamily(p, family) {
	pokemonFamilies.set(p.pokedex, family);
	for (let i in p.evolutions) {
		addToFamily(pokemonByName.get(p.evolutions[i].into), family);
	}
}

function hasFamily(family) {
	for (let i in box) {
		if (pokemonFamilies.get(pokemonByName.get(box[i].name).pokedex) == family) {
			return true;
		}
	}
	for (let i in deadBox) {
		if (pokemonFamilies.get(pokemonByName.get(deadBox[i].name).pokedex) == family) {
			return true;
		}
	}
	return false;
}

function displayTrainers() {
	var v = "";
	for (var i = 0; i < data.trainers.length; i++) {
		var t = data.trainers[i];
		if (t.meta != undefined) {
			v += "<h2>" + t.meta + "</h2>";
		}
		v += '<div class="trainer">'
		v += '<div>' + t.name;
		v += '<button style="float:right;" onclick="calcTrainer(' + i + ')">Calc</button>';
		v += '</div>';
		v += '<div class="trainer-pokes">';
		v += getTeamDisplay(t);
		v += '</div>';
		v += '</div>';
	}
	document.getElementById("trainers").innerHTML = v;
}

function focusLandmark(i) {
	var d = encountersByName.get(landmarksByIndex.get(i).locations[0]);
	if (d !== undefined) {
		focusEncounter(d);
	} else {
		document.getElementById("full-encounter").innerHTML = getEncounterDisplay(landmarksByIndex.get(i).name);
		setTab("full-encounter");
	}
}

function focusEncounter(i) {
	document.getElementById("search-box").value = "";
	updateSearch("");
	document.getElementById("full-encounter").innerHTML = getEncounterDisplay(data.encounters[i]);
	setTab("full-encounter");
}

function focusMove(i) {
	document.getElementById("search-box").value = "";
	updateSearch("");
	document.getElementById("full-move").innerHTML = getFullMoveDisplay(movesByIndex.get(i));
	setTab("full-move");
}

function focusPokeByName(name) {
	focusPokemon(pokemonByName.get(name).pokedex);
}

function focusPokemon(i) {
	document.getElementById("search-box").value = "";
	updateSearch("");
	displayPokemon(document.getElementById("main-poke"), i - 1);
	setTab("full-poke");
}

function getTeamDisplay(t) {
	var v = "";
	for (var i = 0; i < t.team.length; i++) {
		v += getTinyPokemonDisplay(t.team[i]);
	}
	return v;
}

function displayCalcPokemon(root, poke, opponent, right) {
	var player = !right;
	var p = pokemonByName.get(poke.name);

	root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(p);
	root.getElementsByClassName("poke-level")[0].innerHTML = "Lvl " + poke.level;
	root.getElementsByClassName("poke-item")[0].innerHTML = fullCapitalize(poke.item);
	var shiny = isShiny(poke) ? "shiny" : "normal";
	root.getElementsByClassName("poke-icon")[0].innerHTML = '<img src="https://img.pokemondb.net/sprites/crystal/' + shiny + '/' + p.name + '.png">';
	if (right && root.getElementsByClassName("experience").length > 0) {
		var exp = p.base_experience;
		exp = parseInt(exp * 1.5); // Trainer
		exp = parseInt(exp * poke.level);
		exp = parseInt(exp / 7);
		root.getElementsByClassName("experience")[0].innerHTML = " (" + exp + " exp)";
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
			root.getElementsByClassName("status-info")[0].innerHTML = dealt + "/t";
		} else if (status == "tox") {
			var inner = "<h1>Toxic Damage</h1>"
			var base = parseInt(myHp / 16);
			for (var i = 1; i <= 20; i++) {
				inner += '<p>Turn ' + i + ': ' + Math.max(1, base * i) + ' HP</p>';
			}
			root.getElementsByClassName("status-info")[0].innerHTML = '<span>' + base + 'n/t<div class="rolls"><center>' + inner + '</center></div></span>';
		} else {
			root.getElementsByClassName("status-info")[0].innerHTML = "";
		}
	}
	var cHp = document.getElementsByClassName("player-current-hp")[0];
	if (!player) {
		cHp = document.getElementsByClassName("enemy-current-hp")[0];
	}
	if (cHp.value == "") {
		cHp.value = myHp;
	}

	displayCalcStat(root.getElementsByClassName("calc-hp")[0], poke, "hp");
	displayCalcStat(root.getElementsByClassName("calc-atk")[0], poke, "atk");
	displayCalcStat(root.getElementsByClassName("calc-def")[0], poke, "def");
	displayCalcStat(root.getElementsByClassName("calc-spa")[0], poke, "spa");
	displayCalcStat(root.getElementsByClassName("calc-spd")[0], poke, "spd");
	displayCalcStat(root.getElementsByClassName("calc-spe")[0], poke, "spe", player);
	var myStages = "player-stages";
	var theirStages = "enemy-stages";
	if (!player) {
		myStages = "enemy-stages";
		theirStages = "player-stages";
	}
	if (opponent) {
		var mySpe = getModifiedStat(poke, getStages(myStages), "spe");
		var theirSpe = getModifiedStat(opponent, getStages(theirStages), "spe");
		if (badges >= speedBadges) {
			if (player) {
				mySpe = parseInt(mySpe * 1.125);
			} else {
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
			root.getElementsByClassName("speed-indicator")[0].innerHTML = '<div class="speed-faster">&laquo;</div>';
		} else if (mySpe == theirSpe) {
			root.getElementsByClassName("speed-indicator")[0].innerHTML = '<div class="speed-tied">-</div>';
		} else {
			root.getElementsByClassName("speed-indicator")[0].innerHTML = '<div class="speed-slower">&laquo;</div>';
		}
	}
	var types = '<div style="display:flex">' + prettyType(p.types[0]);
	if (p.types.length > 1) {
		types += " " + prettyType(p.types[1]);
	}
	types += "</div>";
	root.getElementsByClassName("poke-types")[0].innerHTML = types;
	var hp = 10;
	if (opponent) {
		hp = getPokeStat(opponent, "hp");
	}
	var moves = '<table class="move-calcs">';
	for (var i = 0; i < 4; i++) {
		if (i < poke.moves.length) {
			var p1 = "<td>" + getMoveName(poke.moves[i]) + "</td>"
			var move = movesByName.get(poke.moves[i]);
			var min = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, false, true);
			var max = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, false, false);
			var rolls = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, false, false, true);
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = "";
			if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra = ' thko';
			}
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra = ' ohko';
			}
			var p2 = '<td class="' + extra + '"><ruby>' + min + " - " + max
				+ "<rt>" + minPercent + "% - " + maxPercent + "%</rt></ruby>"
				+ prettyRolls(rolls) + "</td>";
			if (max == 0 && move.power == 0) {
				p2 = '<td>Status</td>';
			}
			if (opponent == undefined) {
				p2 = "<td>-</td>";
			}
			var min = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, true, true);
			var max = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, true, false);
			var rolls = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), move, player, true, false, true);
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = "";
			if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra = ' thko';
			}
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra = ' ohko';
			}
			var p3 = '<td class="crit' + extra + '"><ruby>' + min + " - " + max
				+ "<rt>" + minPercent + "% - " + maxPercent + "%</rt></ruby>"
				+ prettyRolls(rolls) + "</td>";
			if (max == 0 && move.power == 0) {
				p3 = '<td><ruby><rt>​</rt></ruby></td>';
			}
			moves += "<tr>";
			if (right) {
				moves += p3 + p2 + p1;
			} else {
				moves += p1 + p2 + p3;
			}
			moves += "</tr>";
		} else {
			moves += "<tr><td><ruby>-<rt>​</rt></ruby></td><td><ruby>-<rt>​</rt></ruby></td><td><ruby>-<rt>​</rt></ruby></td></tr>";
		}
	}
	moves += "</table>"
	root.getElementsByClassName("calc-moves")[0].innerHTML = moves;
}

function prettyRolls(rolls) {
	if (!rolls.length) {
		rolls = [rolls];
	}
	var v = '<div class="rolls">';
	v += "<h1>Rolls:</h1>";
	v += "<p>";
	v += ("" + rolls).replace(/,/g, " ");
	v += "</p>";
	var map = new Map();
	for (var i = 0; i < rolls.length; i++) {
		var l = rolls[i];
		if (map.has(l)) {
			map.set(l, map.get(l) + 1);
		} else {
			map.set(l, 1);
		}
	}
	v += "<table><tr>";
	var counts = 0;
	for (var [key, value] of map.entries()) {
		var chance = parseInt(value / rolls.length * 10000) / 100;
		v += "<td><p>" + key + ": " + chance + "%</p></td>";
		counts++;
		if (counts >= 3) {
			v += "</tr><tr>";
			counts = 0;
		}
	}
	v += "</tr></table>"
	v += "</div>";
	return v;
}

function displayCalcStat(div, poke, stat, player = false) {
	var s = getPokeStat(poke, stat);
	var o = s;
	if (badges >= speedBadges && stat == "spe") {
		if (player) {
			s = parseInt(s * 1.125);
		}
		div.getElementsByClassName("stat-num")[0].innerHTML = "<ruby>" + s + "<rt>" + o + "</rt></ruby>";
	} else {
		div.getElementsByClassName("stat-num")[0].innerHTML = s;
	}
}

function getTinyPokemonDisplay(tp, extra = "") {
	var p = pokemonByName.get(tp.name);
	var v = '<div class="tiny-poke">';
	var shiny = isShiny(tp) ? "shiny" : "normal";
	v += '<div class="tiny-poke-icon"><img src="https://img.pokemondb.net/sprites/crystal/' + shiny + '/' + p.name + '.png"></div>';
	v += '<div class="tiny-poke-info">';
	v += '<div>' + pokeLink(p.name) + ' - Lvl ' + tp.level + ' @ ' + fullCapitalize(tp.item) + '</div>';
	v += "<table><tr>";
	for (var i = 0; i < 4; i++) {
		if (i == 2) {
			v += "</tr><tr>";
		}
		if (i == 1 || i == 3) {
			v += "<td></td>";
		}
		if (i < tp.moves.length) {
			var color = "#ffffff";
			if (movesByName.has(tp.moves[i])) {
				var type = movesByName.get(tp.moves[i]).type
				if (tp.moves[i] == "hidden-power") {
					type = getHiddenPower(tp).type;
				}
				color = typeColors.get(type);
			}
			v += '<td><span class="move-emblem" style="background-color:' + color
				+ ';"></span>' + getMoveName(tp.moves[i]) + '</td>';
		} else {
			// Zero width space to force formatting
			v += "<td>​</td>"
		}
	}
	v += "</tr>"
	//v += "<tr><td>HP</td><td>" + p.stats.hp + "</td><td> </td><td>SpA</td><td>" + p.stats.spa + "</td></tr>";
	//v += "<tr><td>Atk</td><td>" + p.stats.atk + "</td><td> </td><td>SpD</td><td>" + p.stats.spd + "</td></tr>";
	//v += "<tr><td>Def</td><td>" + p.stats.atk + "</td><td> </td><td>Spe</td><td>" + p.stats.spe + "</td></tr>";
	v += "</table>";
	var s = getPokeStat(tp, "spe");
	if (extra != "" && badges >= speedBadges) {
		s = parseInt(s * 1.125);
	}
	v += "<div>Spe: " + s;
	if (tp.dvs) {
		v += " DVs: ";
		v += tp.dvs.hp + " "
		v += tp.dvs.atk + "/"
		v += tp.dvs.def + " "
		v += tp.dvs.spa + "/"
		v += tp.dvs.spd + " "
		v += tp.dvs.spe
	}
	v += "</div>"
	v += extra;
	v += "</div></div>";
	return v;
}

function displayPokemon(root, i) {
	var p = data.pokemon[i];
	root.getElementsByClassName("poke-name")[0].innerHTML = pokeLink(p);
	root.getElementsByClassName("poke-dex-num")[0].innerHTML = "#" + padNumber(p.pokedex);
	root.getElementsByClassName("poke-icon")[0].innerHTML = '<img src="https://img.pokemondb.net/sprites/crystal/normal/' + p.name + '.png">';
	var types = '<div style="display:flex">' + prettyType(p.types[0]);
	if (p.types.length > 1) {
		types += " " + prettyType(p.types[1]);
	}
	types += "</div>";
	root.getElementsByClassName("poke-types")[0].innerHTML = types;
	displayStat(root.getElementsByClassName("poke-hp")[0], p.stats.hp);
	displayStat(root.getElementsByClassName("poke-atk")[0], p.stats.atk);
	displayStat(root.getElementsByClassName("poke-def")[0], p.stats.def);
	displayStat(root.getElementsByClassName("poke-spa")[0], p.stats.spa);
	displayStat(root.getElementsByClassName("poke-spd")[0], p.stats.spd);
	displayStat(root.getElementsByClassName("poke-spe")[0], p.stats.spe);
	var evo = "<div>Evolutions:</div>";
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
				before = evolution.item;
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
				before = evolution.item;
			} else if (evolution.method == "level") {
				before = "Level " + evolution.level;
			} else {
				before = evolution.method;
			}
			evo += "<div>" + before + " -> " + pokeLink(evolution.into) + "</div>"
		}
	}
	if (evo != "<div>Evolutions:</div>") {
		evo += "<br>"
		root.getElementsByClassName("poke-evolution")[0].innerHTML = evo;
	} else {
		root.getElementsByClassName("poke-evolution")[0].innerHTML = "";
	}
	var encounters = pokemonEncounters.get(p.name);
	if (encounters) {
		var e = "<details><summary>Encounters:</summary>";
		for (const en of encounters.entries()) {
			var area = en[0];
			var parts = en[1];
			e += "<div>";
			e += "<span class=\"poke-link\" onclick=\"focusEncounter(" + encountersByName.get(area) + ")\">"
				+ fullCapitalize(area) + "</span> - ";
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				e += "<span>";
				e += part.chance + "%";
				e += "</span> ";
			}
			e += "</div>";
		}
		e += "</details>"
		root.getElementsByClassName("encounters")[0].innerHTML = e + "<br>";
	} else {
		root.getElementsByClassName("encounters")[0].innerHTML = "";
	}
	var l = "";
	l += '<div>Learnset:</div><table class="move-table">';
	for (let mi in p.learnset) {
		var m = p.learnset[mi];
		l += getMoveDisplay(movesByName.get(m.move), m.level);
	}
	l += "</table>";
	root.getElementsByClassName("learnset")[0].innerHTML = l;
	l = "";
	l += '<div>TM/HM:</div><table class="move-table">';
	for (let mi in p.tmhm) {
		var m = p.tmhm[mi];
		l += getMoveDisplay(movesByName.get(m));
	}
	l += "</table>";
	root.getElementsByClassName("tmhm")[0].innerHTML = l;
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

function addPoolList(map, name, t, list) {
	for (var i = 0; i < list.length; i++) {
		var p = list[i];
		var poke = p.pokemon;
		if (!map.has(poke)) {
			map.set(poke, new Map());
		}
		var areas = map.get(poke);
		if (!areas.has(name)) {
			areas.set(name, []);
		}
		areas.get(name).push({ chance: p.chance, type: t });
	}
}

function addPoolInfo(pools) {
	var name = pools.area;
	if (pools.normal) {
		addPoolList(pokemonEncounters, name, "Walking", pools.normal.day);
		addPoolList(pokemonEncounters, name, "Walking", pools.normal.night);
		addPoolList(pokemonEncounters, name, "Walking", pools.normal.morning);
	}
	if (pools.surf) {
		addPoolList(pokemonEncounters, name, "Surfing", pools.surf);
	}
	if (pools.headbutt) {
		var pool = headbuttPools.get(pools.headbutt);
		addPoolList(pokemonEncounters, name, "Headbutt", pool.headbutt);
	}
	if (pools.fishing) {
		var pool = fishingPools.get(pools.fishing);
		addPoolList(pokemonEncounters, name, "Old Rod", pool.old.day);
		addPoolList(pokemonEncounters, name, "Old Rod", pool.old.night);
		addPoolList(pokemonEncounters, name, "Good Rod", pool.good.day);
		addPoolList(pokemonEncounters, name, "Good Rod", pool.good.night);
		addPoolList(pokemonEncounters, name, "Super Rod", pool.super.day);
		addPoolList(pokemonEncounters, name, "Super Rod", pool.super.night);
	}
	if (pools.rock) {
		var pool = rockPools.get(pools.rock);
		addPoolList(pokemonEncounters, name, "Rock Smash", pool.rock);
	}
	if (pools.special) {
		for (let i = 0; i < pools.special.length; i++) {
			var pool = pools.special[i];
			if (pool.type == "swarm") {
				addPoolList(pokemonEncounters, name, "Swarm", pool.day);
				addPoolList(pokemonEncounters, name, "Swarm", pool.night);
				addPoolList(pokemonEncounters, name, "Swarm", pool.morning);
			} else if (pool.type == "fishing-swarm") {
				addPoolList(pokemonEncounters, name, "Swarm Old Rod", pool.old.day);
				addPoolList(pokemonEncounters, name, "Swarm Old Rod", pool.old.night);
				addPoolList(pokemonEncounters, name, "Swarm Good Rod", pool.good.day);
				addPoolList(pokemonEncounters, name, "Swarm Good Rod", pool.good.night);
				addPoolList(pokemonEncounters, name, "Swarm Super Rod", pool.super.day);
				addPoolList(pokemonEncounters, name, "Swarm Super Rod", pool.super.night);
			} else {
				addPoolList(pokemonEncounters, name, "Special", pool.pool);
			}
		}
	}
}

function getEncounterDisplay(pools) {
	var landmark;
	if (pools.area) {
		landmark = landmarksByLocation.get(pools.area)
	} else {
		landmark = landmarksByName.get(pools);
	}
	var center = getMapCenter(landmark);
	var v = "";
	var w = 320;
	var h = 280;
	var scale = 40;
	v += '<div>';
	v += '<div class="encounter-minimap">' + getMapDisplay(w, h, -center.x + w / scale / 2, -center.y + h / scale / 2, scale, landmark.name) + '</div>';
	if (pools.area) {
		v += "<h3>" + fullCapitalize(pools.area) + "</h3>";
		v += "<p>Areas:</p>";
		for (var i = 0; i < landmark.locations.length; i++) {
			var e = encountersByName.get(landmark.locations[i]);
			v += '<div class="poke-link" onclick="focusEncounter(' + e + ')">';
			v += fullCapitalize(landmark.locations[i]);
			v += '</div>';
		}
	} else {
		v += "<h3>" + fullCapitalize(pools) + "</h3>";
	}
	v += '<br style="clear:both;"/></div>';
	if (pools.area) {
		if (pools.normal) {
			v += getWalkingPoolDisplay(pools.normal, "Walking");
		}
		if (pools.surf) {
			v += "<p>Surfing (Lvl " + pools.surf[0].level + "):</p>";
			v += getEncounterPoolDisplay(pools.surf, "any");
		}
		if (pools.headbutt) {
			var pool = headbuttPools.get(pools.headbutt);
			v += "<p>Headbutt (Lvl " + pool.headbutt[0].level + "):</p>";
			v += getEncounterPoolDisplay(pool.headbutt, "any");
		}
		if (pools.fishing) {
			v += getFishingPoolDisplay(fishingPools.get(pools.fishing), "");
		}
		if (pools.rock) {
			var pool = rockPools.get(pools.rock);
			v += "<p>Rock Smash (Lvl " + pool.rock[0].level + "):</p>";
			v += getEncounterPoolDisplay(pool.rock, "any");
		}
		if (pools.special) {
			for (let i = 0; i < pools.special.length; i++) {
				var pool = pools.special[i];
				if (pool.type == "swarm") {
					v += getWalkingPoolDisplay(pool, "Swarm");
				} else if (pool.type == "fishing-swarm") {
					v += getFishingPoolDisplay(pool, "Swarm ");
				} else {
					v += "<p>Special:</p>";
					v += getEncounterPoolDisplay(pool.pool, "any");
				}
			}
		}
	}
	return v;
}

function getWalkingPoolDisplay(p, name) {
	let v = "<p>" + name + " (Lvl " + p.day[0].level + "):</p>";
	if (arePoolsEqual(p.day, p.night) && arePoolsEqual(p.night, p.morning)) {
		v += getEncounterPoolDisplay(p.day, "any");
	} else {
		v += getEncounterPoolDisplay(p.day, "day");
		v += getEncounterPoolDisplay(p.night, "night");
		v += getEncounterPoolDisplay(p.morning, "morning");
	}
	return v;
}

function getFishingPoolDisplay(pool, name) {
	let v = "";
	v += "<p>" + name + "Old Rod (Lvl " + pool.old.day[0].level + "):</p>";
	if (arePoolsEqual(pool.old.day, pool.old.night)) {
		v += getEncounterPoolDisplay(pool.old.day, "any");
	} else {
		v += getEncounterPoolDisplay(pool.old.day, "day");
		v += getEncounterPoolDisplay(pool.old.night, "night");
	}
	v += "<p>" + name + "Good Rod (Lvl " + pool.good.day[0].level + "):</p>";
	if (arePoolsEqual(pool.good.day, pool.good.night)) {
		v += getEncounterPoolDisplay(pool.good.day, "any");
	} else {
		v += getEncounterPoolDisplay(pool.good.day, "day");
		v += getEncounterPoolDisplay(pool.good.night, "night");
	}
	v += "<p>" + name + "Super Rod (Lvl " + pool.super.day[0].level + "):</p>";
	if (arePoolsEqual(pool.super.day, pool.super.night)) {
		v += getEncounterPoolDisplay(pool.super.day, "any");
	} else {
		v += getEncounterPoolDisplay(pool.super.day, "day");
		v += getEncounterPoolDisplay(pool.super.night, "night");
	}
	return v;
}

function arePoolsEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

function getEncounterPoolDisplay(pool, time) {
	var v = "";
	v += '<div class="encounter-pool ' + time + '-pool">';
	v += '<div style="display:flex">';
	var totalWeight = 0;
	var lvl = pool[0].level;
	var showLevel = false;
	for (var i = 0; i < pool.length; i++) {
		if (!hasFamily(pokemonFamilies.get(pokemonByName.get(pool[i].pokemon).pokedex))) {
			totalWeight += pool[i].chance;
		}
		if (pool[i].level != lvl) {
			showLevel = true;
		}
	}
	for (var i = 0; i < pool.length; i++) {
		var family = hasFamily(pokemonFamilies.get(pokemonByName.get(pool[i].pokemon).pokedex));
		var percent = parseInt(pool[i].chance / 100 * 10000) / 100;
		var adjustedPercent = "Dupe";
		if (family) {
			v += '<div class="encounter-poke dupe-encounter">';
		} else {
			v += '<div class="encounter-poke">';
			adjustedPercent = parseInt(pool[i].chance / totalWeight * 10000) / 100 + "%";
		}
		var tt = "";
		if (pool[i].extra) {
			tt += ' <div class="extra-info" title="' + pool[i].extra + '">?</div>';
		}

		v += '<div><ruby>' + percent + '%' + tt + '<rt>(' + adjustedPercent + ')';
		if (showLevel) {
			v += " Lvl " + pool[i].level;
		}
		v += '</rt></ruby></div>';
		v += '<img style="cursor:pointer;" onclick="focusPokeByName(\'' + pool[i].pokemon
			+ '\')" src="https://img.pokemondb.net/sprites/crystal/normal/' + pool[i].pokemon + '.png">';
		v += '</div>';
	}
	v += '</div>';
	v += '</div>';
	return v;
}

function prettyType(t) {
	return '<div class="type" style="background-color:' + typeColors.get(t) + ';">' + fullCapitalize(t) + '</div>';
}

function moveLink(move) {
	if (move.name) {
		move = move.name;
	}
	var i = movesByName.get(move).index;
	return '<span class="poke-link" onclick="focusMove(' + i + ')">' + fullCapitalize(move) + '</span>'
}

function getMoveName(move) {
	if (nameFormatting.has(move)) {
		return nameFormatting.get(move);
	}
	return fullCapitalize(move.replace(/-/g, " "));
}

function getFullMoveDisplay(move) {
	var v = "<p>" + getMoveName(move.name) + ":</p>";
	if (move.extra) {
		for (var i = 0; i < move.extra.length; i++) {
			v += "<p>";
			v += move.extra[i];
			v += "</p>"
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
				+ '\')" src="https://img.pokemondb.net/sprites/crystal/normal/' + list[i].pokemon + '.png">';
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
					+ '\')" src="https://img.pokemondb.net/sprites/crystal/normal/' + list[i] + '.png">';
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

function padNumber(s) {
	s = "" + s;
	if (s.length == 1) {
		return "00" + s;
	} else if (s.length == 2) {
		return "0" + s;
	}
	return s;
}

function fullCapitalize(s) {
	s = s.toLowerCase();
	if (nameFormatting.has(s)) {
		return nameFormatting.get(s);
	}
	return s.replace(/-/g, " ").replace(/\w\S*/g, (word) => (word.replace(/^\w/, (c) => c.toUpperCase())));
}

function getEmptyStages() {
	return {
		"hp": 0, "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0
	}
}

function getHiddenPower(poke) {
	function mod4(stat) {
		return (getDv(poke, stat) & 0b11);
	}
	function mSig(stat) {
		return (getDv(poke, stat) & 0b1000) >> 3;
	}
	var t = (mod4("atk") << 2) | mod4("def");
	var types = [
		"fighting", "flying", "poison", "ground",
		"rock", "bug", "ghost", "steel",
		"fire", "water", "grass", "electric",
		"psychic", "ice", "dragon", "dark"
	];
	var ty = types[t];
	var po = ((mSig("spa") + 2 * mSig("spe") + 4 * mSig("def") + 8 * mSig("atk")) * 5 + mod4("spa")) / 2 + 31;
	return { type: ty, power: po };
}

function getSwitchPriority(enemy, player) {
	var prio = 0;
	if (hasSuperEffectiveMove(enemy, player))  {
		prio++;
	}
	if (hasTypeAdvantage(player, enemy)) {
		prio--;
	}
	return prio;
}

function hasSuperEffectiveMove(attacker, defender) {
	var pp = pokemonByName.get(defender.name);
	for (var i = 0; i < attacker.moves.length; i++) {
		var move = movesByName.get(attacker.moves[i]);
		var type = move.type;
		if (move.name.startsWith("hp-")) {
			type = "normal";
		}
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

function hasTypeAdvantage(attacker, defender) {
	var ap = pokemonByName.get(attacker.name);
	var dp = pokemonByName.get(defender.name);
	for (var i = 0; i < ap.types.length; i++) {
		var t = ap.types[i];
		var eff = 1;
		eff *= getMatchup(t, dp.types[0]);
		if (dp.types.length > 1) {
			eff *= getMatchup(t, dp.types[1]);
		}
		if (eff > 1) {
			return true;
		}
	}
	return false;
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

	var burn = false;
	if (!special) {
		if (player && document.getElementById("player").getElementsByClassName("status-select")[0].value == "brn") {
			burn = true;
		} else if (!player && document.getElementById("opponent").getElementsByClassName("status-select")[0].value == "brn") {
			burn = true;
		}
	}

	if (burn) {
		a = (parseInt(a / 2));
	}

	// Badge boost
	if (!ignoreBoosts) {
		if (player && !special && badges >= attackBadges) {
			a = parseInt(a * 1.125);
		}
		if (!player && !special && badges >= defenseBadges) {
			d = parseInt(d * 1.125);
		}
		if (player && special && badges >= specialBadges) {
			a = parseInt(a * 1.125);
		}
		if (!player && special && badges >= specialBadges) {
			d = parseInt(d * 1.125);
		}
	}

	if (!ignoreBoosts) {
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

	if ((attacker.name == "cubone" || attacker.name == "marowak") && ni == "thick-club") {
		a *= 2;
	}
	if (attacker.name == "pikachu" && ni == "light-ball" && special) {
		a *= 2;
	}
	if (defender.name == "ditto" && ndi == "metal-powder") {
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

function getMatchup(attackType, defenseType) {
	if (typeMatchups.has(attackType)) {
		var map = typeMatchups.get(attackType);
		if (map.has(defenseType)) {
			return map.get(defenseType);
		}
	}
	return 1;
}

function getPokeStat(poke, stat) {
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

document.getElementById("search-box").oninput = function (event) {
	var v = event.target.value;
	updateSearch(v);
}

function setTab(name) {
	if (name == "map") {
		setMap();
	}
	if (name != "edit") {
		editing = -1;
	} else {
		if (editing == -1) {
			copyEditedMoves = true;
			clearEdits();
		} else {
			copyEditedMoves = false;
		}
		updateEdit();
	}
	var tabs = document.getElementsByClassName("tab");
	for (var i = 0; i < tabs.length; i++) {
		tabs[i].style.display = "none";
	}
	document.getElementById(name).style.display = "block";
}

var editInputs = document.getElementsByClassName("poke-edit-input");
for (let i in editInputs) {
	editInputs[i].oninput = function (event) {
		if (event.target.id.includes("edit-move")) {
			copyEditedMoves = false;
		}
		updateEdit();
	}
}

function updateEdit() {
	if (editing == -1) {
		document.getElementById("save-poke").style.display = "none";
		document.getElementById("add-poke").style.display = "block";
	} else {
		document.getElementById("save-poke").style.display = "block";
		document.getElementById("add-poke").style.display = "none";
	}
	var poke = getEditedPoke();
	if (poke && copyEditedMoves) {
		var p = pokemonByName.get(poke.name);
		var moves = [];
		for (var i = p.learnset.length - 1; i >= 0; i--) {
			var l = p.learnset[i];
			if (l.level <= poke.level) {
				moves.push(l.move);
			}
		}
		for (var i = 1; i <= 4; i++) {
			var mi = Math.min(moves.length, 4) - i;
			if (mi >= 0) {
				document.getElementById("edit-move-" + i).value = getMoveName(moves[mi]);
			} else {
				document.getElementById("edit-move-" + i).value = "";
			}
		}
		poke = getEditedPoke();
	}
	if (poke) {
		displayCalcPokemon(document.getElementById("edited-poke"), poke, undefined, false);
	}
}

function getEditedPoke() {
	var name = document.getElementById("edit-name").value.toLowerCase().replace(/ /g, "-");
	var item = document.getElementById("edit-item").value.toLowerCase().replace(/-/g, " ");
	var mvs = [];
	if (movesByName.has(document.getElementById("edit-move-1").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-1").value.toLowerCase().replace(/ /g, "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-2").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-2").value.toLowerCase().replace(/ /g, "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-3").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-3").value.toLowerCase().replace(/ /g, "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-4").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-4").value.toLowerCase().replace(/ /g, "-"))
	}
	if (isNaN(parseInt(document.getElementById("edit-lvl").value))) {
		return null;
	}
	if (pokemonByName.has(name)) {
		var poke = {
			name: name,
			item: item,
			level: parseInt(document.getElementById("edit-lvl").value),
			moves: mvs,
			dvs: {
				hp: parseInt(document.getElementById("edit-hp").value),
				atk: parseInt(document.getElementById("edit-atk").value),
				def: parseInt(document.getElementById("edit-def").value),
				spa: parseInt(document.getElementById("edit-spa").value),
				spd: parseInt(document.getElementById("edit-spd").value),
				spe: parseInt(document.getElementById("edit-spe").value),
			}
		};
		return poke;
	}
	return null;
}

function updateCalc() {
	try {
		displayCalcPokemon(document.getElementById("player"), myPoke, theirPoke, false);
		displayCalcPokemon(document.getElementById("opponent"), theirPoke, myPoke, true);
		var v = "";
		for (var i = 0; i < box.length && i < box.length; i++) {
			var shiny = isShiny(box[i]) ? "shiny" : "normal";
			var img = '<img src="https://img.pokemondb.net/sprites/crystal/' + shiny + '/' + box[i].name + '.png">';
			v += '<div onclick="setPlayer(' + i + ')">' + img + "</div>";
		}
		document.getElementById("player").getElementsByClassName("calc-team")[0].innerHTML = v;
		var v = "";
		for (let i in enemyTeam) {
			var shiny = isShiny(enemyTeam[i]) ? "shiny" : "normal";
			var prio = getSwitchPriority(enemyTeam[i], myPoke);
			var prioClass = "neutral-switch-priority";
			if (prio < 0) {
				prioClass = "low-switch-priority";
			} else if (prio > 0) {
				prioClass = "high-switch-priority";
			}
			var img = '<img class="' + prioClass + '" src="https://img.pokemondb.net/sprites/crystal/' + shiny + '/' + enemyTeam[i].name + '.png">';
			v += '<div onclick="setEnemy(' + i + ')">' + img + "</div>";
		}
		document.getElementById("opponent").getElementsByClassName("calc-team")[0].innerHTML = v;
	} catch(e) {
		console.log(e);
	}
}

function isShiny(poke) {
	return getDv(poke, "def") == 10 && getDv(poke, "spa") == 10 && getDv(poke, "spe") == 10 && ((getDv(poke, "atk") & 2) == 2)
}

function getDv(poke, stat) {
	if (poke.dvs) {
		return poke.dvs[stat];
	}
	return 15;
}

function setPlayer(i) {
	myPoke = box[i];
	clearPlayerStages();
	updateCalc();
}

function setEnemy(i) {
	theirPoke = enemyTeam[i];
	clearEnemyStages();
	updateCalc();
}

function addEditedPoke() {
	var poke = getEditedPoke();
	if (poke) {
		box.push(poke);
		updateBox();
		clearEdits();
	}
	setTab("box");
}

function clearEdits() {
	var edits = document.getElementsByClassName("poke-edit-input");
	for (var i = 0; i < edits.length; i++) {
		if (edits[i].type == "number") {
			edits[i].value = "0";
		} else {
			edits[i].value = "";
		}
	}
	document.getElementById("edit-lvl").value = 5;
}

function updateBox() {
	document.getElementById("box-pokes").innerHTML = "";
	for (var i = 0; i < box.length; i++) {
		document.getElementById("box-pokes").innerHTML += getTinyPokemonDisplay(box[i],
			'<div><button onclick="editBox(' + i + ')">Edit</button><button onclick="moveToBoxStart('
			+ i + ')">Move to Start</button><button onclick="calcFromBox('
			+ i + ')">Show in Calc</button><button onclick="removeFromBox('
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

function navigateBattle(i) {
	lastTrainer += i;
	if (lastTrainer < 0) {
		lastTrainer = 0;
	} else if (lastTrainer >= data.trainers.length) {
		lastTrainer = data.trainers.length - 1;
	}
	calcTrainer(lastTrainer);
}

function calcTrainer(i) {
	localStorage.setItem("last-trainer", i);
	lastTrainer = i;
	enemyTeam = data.trainers[i].team;
	document.getElementById("current-trainer-name").innerHTML = data.trainers[i].name;
	setEnemy(0);
	setTab("calc");
}

function calcFromBox(i) {
	theirPoke = box[i];
	updateCalc();
	setTab("calc");
}

function removeFromBox(i) {
	if (window.confirm("Delete from box?")) {
		box.splice(i, 1);
		updateBox();
	}
}

function moveToBoxStart(i) {
	if (i > 0) {
		var t = box[i];
		box.splice(i, 1);
		box.unshift(t);
		updateBox();
	}
}

function editBox(i, ret = "box") {
	clearEdits();
	editing = i;
	var poke = box[i];
	document.getElementById("edit-name").value = poke.name;
	document.getElementById("edit-item").value = poke.item;
	document.getElementById("edit-lvl").value = poke.level;
	for (var j = 0; j < poke.moves.length; j++) {
		document.getElementById("edit-move-" + (j + 1)).value = getMoveName(poke.moves[j]);
	}
	document.getElementById("edit-hp").value = getDv(poke, "hp");
	document.getElementById("edit-atk").value = getDv(poke, "atk");
	document.getElementById("edit-def").value = getDv(poke, "def");
	document.getElementById("edit-spa").value = getDv(poke, "spa");
	document.getElementById("edit-spd").value = getDv(poke, "spd");
	document.getElementById("edit-spe").value = getDv(poke, "spe");
	setTab("edit");
	editReturn = ret;
}

function editCalc() {
	for (var i = 0; i < box.length; i++) {
		if (myPoke === box[i]) {
			editBox(i, "calc");
		}
	}
}

function saveEdited() {
	var poke = getEditedPoke();
	if (poke) {
		var orig = box[editing];
		orig.name = poke.name;
		orig.item = poke.item;
		orig.level = poke.level;
		orig.moves = poke.moves;
		orig.dvs = poke.dvs;
		updateBox();
		setTab(editReturn);
	}
}

function getStages(c) {
	var inputs = document.getElementsByClassName(c);
	var stages = getEmptyStages();
	assignStage(stages, "atk", inputs[0]);
	assignStage(stages, "def", inputs[1]);
	assignStage(stages, "spa", inputs[2]);
	assignStage(stages, "spd", inputs[3]);
	assignStage(stages, "spe", inputs[4]);
	return stages;
}

function assignStage(stages, s, v) {
	var i = parseInt(v.value);
	if (isNaN(i) || i < -6 || i > 6) {
		return;
	}
	stages[s] = i;
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

if (localStorage.getItem("box")) {
	box = JSON.parse(localStorage.getItem("box"));
}

if (localStorage.getItem("dead-box")) {
	deadBox = JSON.parse(localStorage.getItem("dead-box"));
}

if (localStorage.getItem("badges")) {
	badges = parseInt(localStorage.getItem("badges"));
}

function updateBadges() {
	this.badges = parseInt(document.getElementById("badges").value);
	localStorage.setItem("badges", badges);
	updateCalc();
	updateBox();
}

function readNewbox(bytes, start) {
	var pokemon = [];
	var banks = [];
	for (var i = 0; i < 3; i++) {
		var b = bytes[start + 0x14 + i];
		for (var j = 0; j < 8; j++) {
			banks.push((b & 1) == 1);
			b >>= 1;
		}
	}
	for (var i = 0; i < 20; i++) {
		var b = bytes[start + i];
		if (b == 0) {
			continue;
		}
		b--;
		var p = 0x4000;
		if (banks[i]) {
			p = 0x6000;
		}
		p += b * 0x2F;
		var item = bytes[p + 0x01];
		if (itemsById.has(item)) {
			item = itemsById.get(item);
		} else {
			item = "";
		}
		var atk = (bytes[p + 0x15] & 0xf0) >> 4;
		var def = (bytes[p + 0x15] & 0x0f);
		var spe = (bytes[p + 0x16] & 0xf0) >> 4;
		var spa = (bytes[p + 0x16] & 0x0f);
		var spd = spa
		var hp = 8 * (atk & 0b1) + 4 * (def & 0b1) + 2 * (spe & 0b1) + (spa & 0b1);
		var moves = [];
		for (var j = 0; j < 4; j++) {
			var move = bytes[p + 0x02 + j];
			if (movesByIndex.has(move)) {
				moves.push(movesByIndex.get(move).name);
			}
		}
		var caught = bytes[p + 0x1B] & 0b0111_1111;
		var landmark = landmarksByIndex.get(caught);
		if (!landmark) {
			landmark = "unknown";
		} else {
			landmark = landmark.name;
		}
		pokemon.push({
			name: pokemonByPokedex.get(bytes[p]).name,
			level: bytes[p + 0x1c],
			dvs: {
				"hp": hp,
				"atk": atk,
				"def": def,
				"spa": spa,
				"spd": spd,
				"spe": spe
			},
			"moves": moves,
			"item": item,
			"caught": landmark
		});
	}
	return pokemon;
}

function readPokemonList(bytes, start, capacity, increment) {
	var count = bytes[start];
	var p = start + 1;
	var species = [];
	for (var i = 0; i < count; i++) {
		species.push(bytes[p + i]);
	}
	/* Terminator was broken for a patch
	if (bytes[p + count] != 0xff) {
		return;
	}*/
	p += capacity + 1;
	var pokemon = [];
	for (var i = 0; i < count; i++) {
		species[i].level = bytes[p + 0x1f];
		if (bytes[p] != species[i] && species[i] != 0xfd) {
			return;
		}
		var item = bytes[p + 0x01];
		if (itemsById.has(item)) {
			item = itemsById.get(item);
		} else {
			item = "";
		}
		var atk = (bytes[p + 0x15] & 0xf0) >> 4;
		var def = (bytes[p + 0x15] & 0x0f);
		var spe = (bytes[p + 0x16] & 0xf0) >> 4;
		var spa = (bytes[p + 0x16] & 0x0f);
		var spd = spa
		var hp = 8 * (atk & 0b1) + 4 * (def & 0b1) + 2 * (spe & 0b1) + (spa & 0b1);
		var moves = [];
		for (var j = 0; j < 4; j++) {
			var move = bytes[p + 0x02 + j];
			if (movesByIndex.has(move)) {
				moves.push(movesByIndex.get(move).name);
			}
		}
		var caught = bytes[p + 0x1E] & 0b0111_1111;
		var landmark = landmarksByIndex.get(caught);
		if (!landmark) {
			landmark = "unknown";
		} else {
			landmark = landmark.name;
		}
		pokemon.push({
			name: pokemonByPokedex.get(bytes[p]).name,
			level: bytes[p + 0x1f],
			dvs: {
				"hp": hp,
				"atk": atk,
				"def": def,
				"spa": spa,
				"spd": spd,
				"spe": spe
			},
			"moves": moves,
			"item": item,
			"caught": landmark
		});
		p += increment;
	}
	return pokemon;
}

function pokeLink(p) {
	var name = p;
	if (p.name) {
		name = p.name;
	}
	return '<span class="poke-link" onclick="focusPokeByName(\'' + name + '\')">' + fullCapitalize(name) + '</span>'
}

function readFile(file) {
	var reader = new FileReader();
	reader.onload = function (e) {
		var bytes = new Uint8Array(e.target.result);
		if (bytes.length > 32000 && bytes[0x2008] == 99 && bytes[0x2d0f] == 127) {
			pokemon = [];
			deadPokemon = [];
			pokemon = pokemon.concat(readPokemonList(bytes, 0x2865, 6, 48));
			for (var i = 0; i < 16; i++) {
				var l = readNewbox(bytes, 0x2f20 + i * 0x21);
				if (i >= 14) {
					deadPokemon = deadPokemon.concat(l);
				} else {
					pokemon = pokemon.concat(l);
				}
			}
			box = pokemon;
			deadBox = deadPokemon;
			var badgeMask = (bytes[0x23e5] << 8) | bytes[0x23e6];
			badges = 0;
			for (var i = 0; i < 16; i++) {
				if ((badgeMask & 1) == 1) {
					badges++;
				}
				badgeMask >>= 1;
			}
			document.getElementById("badges").value = badges;
			updateBadges();
			if (box.length > 0) {
				setPlayer(0);
			}
			updateBox();
		} else {
			console.log(bytes[0x2008]);
			console.log(bytes[0x2d0f]);
			console.log("File doesn't appear to be a save file!");
		}
	};
	reader.readAsArrayBuffer(file);
}

document.ondrop = function (event) {
	if (event.dataTransfer.files) {
		var file = event.dataTransfer.files[0];
		readFile(file);
	}
	event.preventDefault();
}

document.ondragover = function (event) {
	event.preventDefault();
}

document.getElementById("badges").oninput = function (event) {
	updateBadges();
}

document.getElementById("badges").value = badges;

updateSearch(document.getElementById("search-box").value);