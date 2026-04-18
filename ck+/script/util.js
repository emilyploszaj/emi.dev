const STATS = ["hp", "atk", "def", "spa", "spd", "spe"];

function getTinyPokemonDisplay(tp, extra = "") {
	var p = pokemonByName.get(tp.name);
	if (p == undefined) {
		console.warn("Tried to render an unknown pokemon " + tp.name);
		return "";
	}
	var v = '<div class="tiny-poke">';
	v += '<div class="tiny-poke-header">';
	v += '<div class="tiny-poke-icon"><img src="' + getPokeImage(tp, "small") + '"></div>';
	v += '<div class="tiny-poke-info">';
	v += `<div style="display:flex;flex-wrap:wrap;">${pokeLink(p.name)} <span class="tiny-poke-level">Lvl ${tp.level}</span></div>`;
	var typeDisplay = "";
	for (let t of p.types) {
		typeDisplay += prettyType(t);
	}
	v += `<div class="tiny-poke-types">${typeDisplay}</div>`;
	v += `<div>${itemLink(tp.item)}</div>`;
	v += `<div class="tiny-poke-dvs">`;
	var nature = CalcNature.of(tp.nature);
	for (const stat of STATS) {
		var sv = tp.dvs?.[stat] ?? MAX_DV;
		if (nature.isBoon(stat)) {
			v += `<span class="dv-plus">${sv}</span>`;
		} else if (nature.isBane(stat)) {
			v += `<span class="dv-minus">${sv}</span>`;
		} else {
			v += sv;
		}
		if (stat == "atk" || stat == "spa") {
			v += "/";
		} else {
			v += " ";
		}
	}
	v += "</div>";
	v += `<div>${fullCapitalize(tp.ability ?? "")}</div>`;
	v += `</div></div><div class="tiny-poke-moves"><table><tr>`;
	for (var i = 0; i < 4; i++) {
		if (i == 2) {
			v += "</tr><tr>";
		}
		if (i < tp.moves.length) {
			var type = "curse";
			if (movesByName.has(tp.moves[i])) {
				var type = movesByName.get(tp.moves[i]).type
				if (tp.moves[i] == "hidden-power") {
					type = engine.getHiddenPower(tp).type;
				}
			}
			//v += `<td class="move-emblem" style="--type-color:${color};">${moveLink(tp.moves[i])}</td>`;
			v += `<td>${getTypeEmblem(type)}${moveLink(tp.moves[i])}</td>`;
		} else {
			// Zero width space to force formatting
			v += "<td>​</td>"
		}
	}
	v += "</tr>"
	v += "</table>";
	v += extra;
	v += "</div></div>";
	return v;
}

function getPokeImage(poke, size, unownExtra = undefined) {
	var shiny = poke.name && isShiny(poke) ? "shiny" : "normal";
	if (poke.name) {
		if (poke.name == "unown" && !unownExtra) {
			var letter = ((getDv(poke, "atk") & 0b0110) << 5) | ((getDv(poke, "def") & 0b0110) << 3) | ((getDv(poke, "spe") & 0b0110) << 1) | ((getDv(poke, "spa") & 0b0110) >> 1);
			letter = (letter / 10) | 0;
			letter = String.fromCharCode(97 + letter);
			poke = poke.name + "-" + letter;
		} else {
			poke = poke.name;
		}
	}
	if (unownExtra !== undefined && poke == "unown") {
		poke += ["-b", "-u", "-n", "-n", "-y", "-q", "-t"][unownExtra];
	}
	if (game.name == "pk") {
		return 'https://img.pokemondb.net/sprites/platinum/' + shiny + '/' + poke + '.png';
	}
	return 'https://img.pokemondb.net/sprites/crystal/' + shiny + '/' + poke + '.png';
}

function getTargeting(move) {
	var targetMap = {
		"self": {
			grid: [false, false, false, true, false, false]
		},
		"adjacent": {
			grid: [true, true, false, false, true, false]
		},
		"adjacent-opponents": {
			grid: [true, true, false, false, false, false],
			all: true
		},
		"all-opponents": {
			grid: [true, true, true, false, false, false],
			all: true
		},
		"adjacent-ally": {
			grid: [false, false, false, false, true, false]
		},
		"adjacent-opponent": {
			grid: [true, true, false, false, false, false]
		},
		"all-allies": {
			grid: [false, false, false, true, true, true],
			all: true
		},
		"user-or-ally": {
			grid: [false, false, false, true, true, false]
		},
		"all-adjacent": {
			grid: [true, true, false, false, true, false],
			all: true
		},
		"all": {
			grid: [true, true, true, true, true, true],
			all: true
		},
	}
	if (targetMap[move.target]) {
		return targetMap[move.target];
	} else {
		return targetMap["adjacent-ally"];
	}
}

function contains(list, value) {
	for (let i of list) {
		if (i == value) {
			return true;
		}
	}
	return false;
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

/**
 * @param {String} s 
 * @returns {String}
 */
function normalize(s) {
	if (s == undefined) {
		return s;
	}
	return s.toLowerCase().replaceAll(/[ _]/g, "-")
}

function fullCapitalize(s) {
	if (s == undefined) {
		return s;
	}
	s = s.toLowerCase();
	if (nameFormatting.has(s)) {
		return nameFormatting.get(s);
	} else if (s.startsWith("tm-")) {
		return s.replace("tm-", "TM");
	} else if (s.startsWith("hm-")) {
		return s.replace("hm-", "HM");
	}
	return s.replace(/[-_]/g, " ").replace(/\w\S*/g, (word) => (word.replace(/^\w/, (c) => c.toUpperCase())));
}

function getMoveName(move) {
	if (nameFormatting.has(move)) {
		return nameFormatting.get(move);
	}
	return fullCapitalize(move.replace(/-/g, " "));
}

function getTrainerName(s) {
	return fullCapitalize(s);
}

function isShiny(poke) {
	return getDv(poke, "def") == 10 && getDv(poke, "spa") == 10 && getDv(poke, "spe") == 10 && ((getDv(poke, "atk") & 2) == 2)
}

function getGender(poke) {
	if (poke.gender) {
		if (poke.gender == "female") {
			return 1;
		} else if (poke.gender == "male") {
			return 2;
		} else {
			return 0;
		}
	}
	p = pokemonByName.get(poke.name);
	if (p.gender.startsWith("f")) {
		var atk = getDv(poke, "atk");
		var def = getDv(poke, "def");
		var spa = getDv(poke, "spa");
		var spe = getDv(poke, "spe");
		var sum = 15;
		sum = (sum ^ atk) & 15;
		sum = (sum ^ ((def << 3) | (def >> 1))) & 15;
		sum = (sum ^ ((spe << 2) | (spe >> 2))) & 15;
		sum = (sum ^ ((spa << 1) | (spa >> 3))) & 15;
		var m = parseInt(parseFloat(p.gender.substring(1)) * 16 / 100);
		if (sum >= m) {
			return 2;
		} else {
			return 1;
		}
	} else {
		return 0;
	}
}

function getDv(poke, stat) {
	return poke?.dvs?.[stat] ?? MAX_DV;
}

function getEmptyStages() {
	return {
		"hp": 0, "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0
	}
}

function getSwitchPriority(enemy, player) {
	if (game.name == "pk") {
		return 0;
	}
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

function getMatchup(attackType, defenseType) {
	if (typeMatchups.has(attackType)) {
		var map = typeMatchups.get(attackType);
		if (map.has(defenseType)) {
			return map.get(defenseType);
		}
	}
	return 1;
}

function hasPriority(poke) {
	if (poke.item == "quick-claw") {
		return true;
	}
	for (var i = 0; i < poke.moves.length; i++) {
		if (poke.moves[i].priority > 0 || priorityMoves.has(poke.moves[i])) {
			return true;
		}
	}
	return false;
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

function updateBadges() {
	badges = parseInt(document.getElementById("badges").value);
	savedData["badges"] = badges;
	writeLocalStorage();
	updateCalc();
	updateBox();
}

function setTab(name) {
	if (name == "map") {
		setMap();
	} else if (name == "commands") {
		setCommands();
	} else if (name == "settings") {
		updateExtraDupes();
	}
	var tabs = document.getElementsByClassName("tab");
	for (var i = 0; i < tabs.length; i++) {
		tabs[i].style.display = "none";
	}
	document.getElementById(name).style.display = "block";
}

function closePopup() {
	document.getElementById("info-popup").innerHTML = "";
}

function selectTabInDisplay(content, tab) {
	var doc = new DOMParser().parseFromString(content, "text/html");
	doc.getElementsByClassName("tab-button")[tab].classList.add("selected-tab-button");
	doc.getElementsByClassName("tab-contents")[tab].style.display = "block";
	return doc.body.innerHTML;
}

function toPercent(number) {
	return Math.round((1000 * number) / 10);
}

function doesElementContain(el, x, y) {
	var rect = el.getBoundingClientRect();
	if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
		return true;
	}
	return false;
}

Object.defineProperty(Array.prototype, "contains", {
	value: function(some) {
		return this.indexOf(some) != -1;
	}
});

Object.defineProperty(Array.prototype, "displayMap", {
	value: function(func) {
		return this.map(func).join("");
	}
});

class LevelRange {

	constructor(min, max) {
		this.min = min;
		this.max = max;
	}

	static empty() {
		return new LevelRange(undefined, undefined);
	}

	expand(val) {
		if (this.min == undefined) {
			this.min = val;
			this.max = val;
		}
		if (val < this.min) {
			this.min = val;
		} else if (val > this.max) {
			this.max = val;
		}
	}

	display() {
		if (this.min == this.max) {
			return `` + this.min;
		}
		return `${this.min}-${this.max}`;
	}
}
