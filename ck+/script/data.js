var data;
var game;
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
	["fairy", "#fc88cf"],
	["curse", "#68a090"]
]);
var typeMatchups = new Map();
var searchResults = new Map();
var pokemonByName = new Map();
var pokemonByPokedex = new Map();
var pokemonByItem = new Map();
var pokemonFamilies = new Map();
var encountersByName = new Map();
var pokemonEncounters = new Map();
var movesByName = new Map();
var movesByIndex = new Map();
var movesByLearnset = new Map();
var movesByTMHM = new Map();
var itemsByName = new Map();
var encounterPools = new Map();
var landmarksByIndex = new Map();
var landmarksByName = new Map();
var landmarksByLocation = new Map();
var landmarksByItem = new Map();
var fightsByTrainer = new Map();
var bringsByTrainer = new Map();
var trainersByName = new Map();
var myPoke;
var theirPoke;
var box = [];
var deadBox = [];
var enemyTeam = [];
var editing = -1;
var copyEditedMoves = false;
var badges = 0;
var lastTrainer = 17;
var caughtLandmarks = new Set();
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
	[0x52, "kings-rock"],
	[0x53, "bitter-berry"],
	[0x54, "mint-berry"],
	[0x58, "silverpowder"],
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
	[0x98, "berserk-gene"],
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
	"SecretPotion",
];
var nameFormatting = new Map();

var priorityMoves = new Set([
	"quick-attack", "mach-punch", "extremespeed", "protect", "detect", "endure"
]);

function loadData(text) {
	for (let i in trueNames) {
		var lower = trueNames[i].toLowerCase().replace(/ /g, "-");
		nameFormatting.set(lower, trueNames[i]);
	}
	nameFormatting.set("kings-rock", "King's Rock");
	nameFormatting.set("dragons-den", "Dragon's Den");
	data = JSON.parse(text);
	loadEngine("script/engine/ck+.js");
}

function loadFights(text) {
	var j = JSON.parse(text);
	for (const f of j.fights) {
		var t = f.trainer.toLowerCase();
		if (!fightsByTrainer.has(t)) {
			fightsByTrainer.set(t, []);
		}
		fightsByTrainer.get(t).push(f);
	}
	for (const f of fightsByTrainer.values()) {
		var t = f[0].trainer;
		bringsByTrainer.set(t, calculateBrings(f));
	}
}

function initGame() {
	game = {};
	if (window.location.search == "?custom") {
		game.name = "custom";
		loadData(localStorage.getItem("calc/custom-data"));
		return;
	} else if (window.location.search == "?xp" || window.location.search == "?xp=") {
		game.name = "ck+xp";
		fetchData("ck+xp.json");
	} else {
		game.name = "ck+";
		fetchData("data.json");
		fetchFights("fights.json");
	}
	updateEngineFlags();
}

function updateEngineFlags() {
	var flags = ["dvs"];
	if (settings.enableStatistics) {
		flags.push("statistics");
	}
	setEngineDisplayFlags(flags);
}

function fetchData(file) {
	fetch(file)
		.then(response => response.text())
		.then(text => {
			loadData(text);
	});
}

function fetchFights(file) {
	fetch(file)
		.then(response => response.text())
		.then(text => {
			loadFights(text);
	});
}

function loadEngine(src) {
	var script = document.createElement("script");
	script.onload = function() {
		startup();
	};
	script.src = src;
	document.body.appendChild(script);
}

function startup() {
	var j = data;
	for (let i in j.pokemon) {
		var p = j.pokemon[i];
		pokemonByName.set(p.name, p);
		pokemonByPokedex.set(p.pokedex, p);
		searchResults.set(p.name, {link: `#/pokemon/${p.name}/`});
		for (let j in p.items) {
			if (!pokemonByItem.has(p.items[j].item)) {
				pokemonByItem.set(p.items[j].item, []);
			}
			pokemonByItem.get(p.items[j].item).push({pokemon: p.name, chance: p.items[j].chance});
		}
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

	for (let e of typeColors) {
		addSearchResult(e[0], {link: `#/type/${e[0]}/`});
	}
	for (let m of j.moves) {
		if (m.template) {
			var template = j.templates.move[m.template];
			delete m.template;
			Object.assign(m, template);
		}
		movesByName.set(m.name, m);
		if (m.index) {
			movesByIndex.set(m.index, m);
		}
		addSearchResult(m.name, {link: `#/move/${m.name}/`});
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
		for (var k = 0; k < j.landmarks[i].items.length; k++) {
			if (!landmarksByItem.has(j.landmarks[i].items[k].item)) {
				landmarksByItem.set(j.landmarks[i].items[k].item, []);
			}
			landmarksByItem.get(j.landmarks[i].items[k].item).push(j.landmarks[i]);
		}
	}
	for (const i of j.items) {
		itemsByName.set(i.name, i);
		addSearchResult(i.name, {link: `#/item/${i.name}/`, display: () => prettyItem(i)});
	}
	for (let i in j.encounters) {
		var e = j.encounters[i];
		encountersByName.set(e.area, i);
		addSearchResult(e.area, {link: `#/area/${e.area}/`});
	}
	encounterPools = j.encounter_pools;
	for (let i in j.encounters) {
		addPoolInfo(j.encounters[i]);
	}

	for (let i in j.trainers) {
		var t = j.trainers[i];
		t.index = parseInt(i);
		trainersByName.set(t.name, t);
		addSearchResult(getTrainerName(j.trainers[i].name), {link: `#/trainer/${t.name}/`});
	}
	data = j;
	var a = j.trainers[0].team[0];
	myPoke = JSON.parse(JSON.stringify(a));
	if (box.length > 0) {
		myPoke = box[0];
	}
	var lt = parseInt(orElse(savedData["last-trainer"], 0));
	if (lt >= 0 && lt < j.trainers.length) {
		calcTrainer(lt);
	} else {
		calcTrainer(0);
	}
	updateCalc();
	updateBox();
	displayTrainers();
	if (box.length > 0) {
		setTab("calc");
	} else {
		setTab("box");
	}
	navigate(window.location.hash);
}

function addSearchResult(name, value) {
	searchResults.set(normalize(name), value);
}

function getFamily(poke) {
	var family = pokemonFamilies.get(poke.pokedex);
	var result = [];
	for (const p of data.pokemon) {
		if (pokemonFamilies.get(p.pokedex) == family) {
			result.push(p);
		}
	}
	return result;
}

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
	for (const d of orElse(settings.extraDupes, [])) {
		if (pokemonFamilies.get(pokemonByName.get(d).pokedex) == family) {
			return true;
		}
	}
	return false;
}
