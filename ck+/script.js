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
var movesByName = new Map();
var myPoke;
var theirPoke;
var box = [];
var enemyTeam = [];
var editing = -1;
var copyEditedMoves = false;
var badges = 0;
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
	["dragon", 8]
	// TODO unreleased gym leader order
]);
var typeEnhancements = new Map([
	["pink bow", "normal"],
	["charcoal", "fire"],
	["mystic water", "water"],
	["magnet", "electric"],
	["miracle seed", "grass"],
	["nevermeltice", "ice"],
	["blackbelt", "fighting"],
	["poison barb", "poison"],
	["soft sand", "ground"],
	["sharp beak", "flying"],
	["twistedspoon", "psychic"],
	["silverpowder", "bug"],
	["hard stone", "rock"],
	["spell tag", "ghost"],
	["dragon fang", "dragon"],
	["blackglasses", "dark"],
	["metal coat", "steel"]
]);

var multiHitMoves = new Set([
	"barrage", "bone-rush", "comet-punch", "doubleslap",
	"fury-attack", "fury-swipes", "pin-missile", "spike-cannon"
]);
var doubleHitMoves = new Set([
	"bonemerang", "double-hit", "double-kick"
])

fetch("./data.json")
	.then(response => response.text())
	.then(text => {
		var j = JSON.parse(text);
		for (let i in j.pokemon) {
			var p = j.pokemon[i];
			pokemonByName.set(p.name, p);
			searchResults.set(p.name, 'focusPokemon(' + (p.pokedex) + ')');
		}
		for (let i in j.moves) {
			var m = j.moves[i];
			movesByName.set(m.name, m);
		}
		for (let i in j.type_matchups) {
			var m = j.type_matchups[i];
			if (!typeMatchups.has(m.attacker)) {
				typeMatchups.set(m.attacker, new Map());
			}
			var map = typeMatchups.get(m.attacker);
			map.set(m.defender, m.multiplier);
		}
		enemyTeam = j.trainers[17].team;
		if (localStorage.getItem("last-trainer")) {
			var lt = localStorage.getItem("last-trainer");
			if (lt >= 0 && lt < j.trainers.length) {
				enemyTeam = j.trainers[lt].team;
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

	root.getElementsByClassName("poke-name")[0].innerHTML = fullCapitalize(p.name);
	root.getElementsByClassName("poke-level")[0].innerHTML = "Lvl " + poke.level;
	root.getElementsByClassName("poke-item")[0].innerHTML = poke.item;
	root.getElementsByClassName("poke-icon")[0].innerHTML = '<img src="https://img.pokemondb.net/sprites/crystal/normal/' + p.name + '.png">';

	displayCalcStat(root.getElementsByClassName("calc-hp")[0], poke, "hp");
	displayCalcStat(root.getElementsByClassName("calc-atk")[0], poke, "atk");
	displayCalcStat(root.getElementsByClassName("calc-def")[0], poke, "def");
	displayCalcStat(root.getElementsByClassName("calc-spa")[0], poke, "spa");
	displayCalcStat(root.getElementsByClassName("calc-spd")[0], poke, "spd");
	displayCalcStat(root.getElementsByClassName("calc-spe")[0], poke, "spe", player);
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
	var myStages = "player-stages";
	var theirStages = "enemy-stages";
	if (!player) {
		myStages = "enemy-stages";
		theirStages = "player-stages";
	}
	var moves = '<table class="move-calcs">';
	for (var i = 0; i < 4; i++) {
		if (i < poke.moves.length) {
			var p1 = "<td>" + getMoveName(poke.moves[i]) + "</td>"
			var min = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), movesByName.get(poke.moves[i]), player, false, true);
			var max = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), movesByName.get(poke.moves[i]), player, false, false);
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = "";
			if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra = ' thko';
			}
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra = ' ohko';
			}
			var p2 = '<td class="' + extra + '"><ruby>' + min + " - " + max + "<rt>" + minPercent + "% - " + maxPercent + "%</rt></ruby></td>";
			if (max == 0) {
				p2 = "<td>-<ruby><rt></rt></ruby></td>";
			}
			var min = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), movesByName.get(poke.moves[i]), player, true, true);
			var max = getDamage(poke, opponent, getStages(myStages), getStages(theirStages), movesByName.get(poke.moves[i]), player, true, false);
			var minPercent = Math.round(1000 * min / hp) / 10;
			var maxPercent = Math.round(1000 * max / hp) / 10;
			var extra = "";
			if (minPercent >= 50 || (!player && maxPercent >= 50)) {
				extra = ' thko';
			}
			if (minPercent >= 100 || (!player && maxPercent >= 100)) {
				extra = ' ohko';
			}
			var p3 = '<td class="crit' + extra + '"><ruby>' + min + " - " + max + "<rt>" + minPercent + "% - " + maxPercent + "%</rt></ruby></td>";
			if (max == 0) {
				p3 = "<td>-<ruby><rt></rt></ruby></td>";
			}
			moves += "<tr>";
			if (right) {
				moves += p3 + p2 + p1;
			} else {
				moves += p1 + p2 + p3;
			}
			moves += "</tr>";
		} else {
			moves += "<tr><td>-<ruby><rt></rt></ruby></td></tr>";
		}
	}
	moves += "</table>"
	root.getElementsByClassName("calc-moves")[0].innerHTML = moves;
}

function displayCalcStat(div, poke, stat, player = false) {
	var s = getPokeStat(poke, stat);
	var o = s;
	if (player && badges >= speedBadges) {
		s = parseInt(s * 1.125);
		div.getElementsByClassName("stat-num")[0].innerHTML = "<ruby>" + s + "<rt>" + o + "</rt></ruby>";
	} else {
		div.getElementsByClassName("stat-num")[0].innerHTML = s;
	}
}

function getTinyPokemonDisplay(tp, extra = "") {
	var p = pokemonByName.get(tp.name);
	var v = '<div class="tiny-poke">';
	v += '<div class="tiny-poke-icon"><img src="https://img.pokemondb.net/sprites/crystal/normal/' + p.name + '.png"></div>';
	v += '<div class="tiny-poke-info">';
	v += '<div>' + fullCapitalize(p.name) + ' - Lvl ' + tp.level + ' @ ' + tp.item + '</div>';
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
	v += "<div>Spe: " + getPokeStat(tp, "spe") + "</div>"
	v += extra;
	v += "</div></div>";
	return v;
}

function displayPokemon(root, i) {
	var p = data.pokemon[i];
	root.getElementsByClassName("poke-name")[0].innerHTML = fullCapitalize(p.name);
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
	var l = "";
	l += '<div>Learnset:</div><table class="move-table">';
	for (let mi in p.learnset) {
		var m = p.learnset[mi];
		l += getMoveDisplay(movesByName.get(m.move), m.level);
	}
	l += "</table>";
	root.getElementsByClassName("learnset")[0].innerHTML = l;
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

function prettyType(t) {
	return '<div class="type" style="background-color:' + typeColors.get(t) + ';">' + fullCapitalize(t) + '</div>';
}

function getMoveName(move) {
	return fullCapitalize(move.replace("-", " "));
}

function getMoveDisplay(move, level = undefined) {
	var v = '<tr>';
	if (level != undefined) {
		v += '<td>' + level + '</td>';
	}
	v += '<td>' + prettyType(move.type) + '</td>';
	v += '<td>' + getMoveName(move.name) + '</td>';
	if (move.power == 0) {
		v += '<td>-</td>';
	} else {
		v += '<td>' + move.power + '</td>';
	}
	v += '<td>' + move.accuracy + '</td>';
	v += '<td>' + move.pp + '</td>';
	if (move.extra && move.extra.length > 0) {
		var alt = "Extra info from docs:"
		for (var i = 0; i < move.extra.length; i++) {
			alt += "\n" + move.extra[i];
		}
		v += '<td title="' + alt + '">?</td>';
	} else {
		v += '<td></td>';
	}
	v += '</tr>';
	return v;
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
	return s.replace(/\w\S*/g, (word) => (word.replace(/^\w/, (c) => c.toUpperCase())));
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
	return {type: ty, power: po};
}

function getDamage(attacker, defender, attackerStages, defenderStages, move, player, crit, low) {
	if (defender == undefined) {
		return 0;
	}
	var power = move.power;
	var type = move.type;
	if (move.name == "magnitude") {
		if (low) {
			power = 10;
		} else {
			power = 150;
		}
	}
	if (move.name == "hidden-power") {
		var hp = getHiddenPower(attacker);
		power = hp.power;
		type = hp.type;
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
	if (crit) {
		if (defenderStages[defenseStat] >= attackerStages[attackStat]) {
			a = getPokeStat(attacker, attackStat);
		}
		d = getPokeStat(defender, defenseStat);
	}
	if (move.name == "explosion" || move.name == "selfdestruct") {
		d = Math.max(1, parseInt(d / 2));
	}

	// TODO burn?

	// Badge boost
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

	// screens

	if ((attacker.name == "cubone" || attacker.name == "marowak") && attacker.item == "Thick Club") {
		a *= 2;
	}
	if (attacker.name == "pikachu" && attacker.item == "Light Ball" && special) {
		a *= 2;
	}
	if (defender.name == "ditto" && defender.item == "Metal Powder") {
		d = d * 1.5;
	}
	v = parseInt(parseInt(v * a) / d);

	v = parseInt(v / 50);
	if (crit) {
		v *= 2;
	}
	var ni = attacker.item.toLowerCase();
	if (typeEnhancements.has(ni) && typeEnhancements.get(ni) == type) {
		v *= 1.1;
		v = parseInt(v);
	}
	v += 2;

	// TODO if (weather)

	if (badgeTypes.has(type) && badgeTypes.get(type) <= badges) {
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
	} else if (move.name == "sonic-boom") {
		return 20;
	} if (move.name == "seismic-toss" || move.name == "night-shade" || move.name == "psywave") {
		return attacker.level;
	}
	// Unhandled special move
	if (power == 1) {
		return -1;
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
				res += '<div class="search-suggestion" onmousedown="' + n[1] + '">' + n[0] + '</div>';
				amount++;
				if (amount >= 8) {
					break;
				}
			}
		}
	}
	document.getElementById("search-suggestions").innerHTML = res;
}

document.getElementById("main-poke").onclick = function(event) {
	displayPokemon(document.getElementById("main-poke"), parseInt(Math.random() * 251));
}

document.getElementById("search-box").oninput = function(event) {
	var v = event.target.value;
	updateSearch(v);
}

function setTab(name) {
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
	editInputs[i].oninput = function(event) {
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
	var name = document.getElementById("edit-name").value.toLowerCase().replace(" ", "-");
	var mvs = [];
	if (movesByName.has(document.getElementById("edit-move-1").value.toLowerCase().replace(" ", "-"))) {
		mvs.push(document.getElementById("edit-move-1").value.toLowerCase().replace(" ", "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-2").value.toLowerCase().replace(" ", "-"))) {
		mvs.push(document.getElementById("edit-move-2").value.toLowerCase().replace(" ", "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-3").value.toLowerCase().replace(" ", "-"))) {
		mvs.push(document.getElementById("edit-move-3").value.toLowerCase().replace(" ", "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-4").value.toLowerCase().replace(" ", "-"))) {
		mvs.push(document.getElementById("edit-move-4").value.toLowerCase().replace(" ", "-"))
	}
	if (isNaN(parseInt(document.getElementById("edit-lvl").value))) {
		return null;
	}
	if (pokemonByName.has(name)) {
		var poke = {
			name: name,
			item: "",
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
	displayCalcPokemon(document.getElementById("player"), myPoke, theirPoke, false);
	displayCalcPokemon(document.getElementById("opponent"), theirPoke, myPoke, true);
	var v = "";
	for (var i = 0; i < 6 && i < box.length; i++) {
		var img = '<img src="https://img.pokemondb.net/sprites/crystal/normal/' + box[i].name + '.png">';
		v += '<div onclick="setPlayer(' + i + ')">' + img + "</div>";
	}
	document.getElementById("player").getElementsByClassName("calc-team")[0].innerHTML = v;
	var v = "";
	for (let i in enemyTeam) {
		var img = '<img src="https://img.pokemondb.net/sprites/crystal/normal/' + enemyTeam[i].name + '.png">';
		v += '<div onclick="setEnemy(' + i + ')">' + img + "</div>";
	}
	document.getElementById("opponent").getElementsByClassName("calc-team")[0].innerHTML = v;
}

function getDv(poke, stat) {
	if (poke.dvs) {
		return poke.dvs[stat];
	}
	return 15;
}

function setPlayer(i) {
	myPoke = box[i];
	updateCalc();
}

function setEnemy(i) {
	theirPoke = enemyTeam[i];
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
	updateCalc();
}

function calcTrainer(i) {
	localStorage.setItem("last-trainer", i);
	enemyTeam = data.trainers[i].team;
	theirPoke = enemyTeam[0];
	updateCalc();
	setTab("calc");
}

function calcFromBox(i) {
	myPoke = box[i];
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

function editBox(i) {
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
		setTab("box");
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
	var inputs = document.getElementsByClassName("player-stages");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].value = "0";
	}
	updateCalc();
}

function clearEnemyStages() {
	var inputs = document.getElementsByClassName("enemy-stages");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].value = "0";
	}
	updateCalc();
}

if (localStorage.getItem("box")) {
	box = JSON.parse(localStorage.getItem("box"));
}

if (localStorage.getItem("badges")) {
	badges = parseInt(localStorage.getItem("badges"));
}

function updateBadges() {
	this.badges = parseInt(document.getElementById("badges").value);
	localStorage.setItem("badges", badges);
	updateCalc();
}

document.getElementById("badges").oninput = function(event) {
	updateBadges();
}

document.getElementById("badges").value = badges;

updateSearch(document.getElementById("search-box").value);