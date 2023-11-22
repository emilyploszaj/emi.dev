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

var statisticsSplits = new Set([
	"Falkner FALKNER (1) FALKNER",
	"Bugsy BUGSY (1) BUGSY",
	"Whitney WHITNEY (1) WHITNEY",
	"Morty MORTY (1) MORTY",
	"Chuck CHUCK (1) CHUCK",
	"Pryce PRYCE (1) PRYCE",
	"Jasmine JASMINE (1) JASMINE",
	"Clair CLAIR (1) CLAIR",
	"LtSurge LT_SURGE (1) LT.SURGE",
	"Sabrina SABRINA (1) SABRINA",
	"Janine JANINE (1) JANINE",
	"Erika ERIKA (1) ERIKA",
	"Brock BROCK (1) BROCK",
	"Misty MISTY (1) MISTY",
	"Blaine BLAINE (1) BLAINE",
	"Blue BLUE (1) BLUE"
]);

var priorityMoves = new Set([
	"quick-attack", "mach-punch", "extremespeed", "protect", "detect", "endure"
]);
var multiHitMoves = new Set([
	"barrage", "bone-rush", "comet-punch", "doubleslap",
	"fury-attack", "fury-swipes", "pin-missile", "spike-cannon"
]);
var doubleHitMoves = new Set([
	"bonemerang", "double-hit", "double-kick", "twineedle"
]);

function fetchData() {
	fetch("./data.json")
	.then(response => response.text())
	.then(text => {
		for (let i in trueNames) {
			var lower = trueNames[i].toLowerCase().replace(/-/g, " ");
			nameFormatting.set(lower, trueNames[i]);
		}
		nameFormatting.set("kings-rock", "King's Rock");
		var j = JSON.parse(text);
		for (let i in j.pokemon) {
			var p = j.pokemon[i];
			pokemonByName.set(p.name, p);
			pokemonByPokedex.set(p.pokedex, p);
			searchResults.set(p.name, 'focusPokemon(' + (p.pokedex) + ')');
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
			for (var k = 0; k < j.landmarks[i].items.length; k++) {
				if (!landmarksByItem.has(j.landmarks[i].items[k].item)) {
					landmarksByItem.set(j.landmarks[i].items[k].item, []);
				}
				landmarksByItem.get(j.landmarks[i].items[k].item).push(j.landmarks[i]);
			}
		}
		for (const i of j.items) {
			itemsByName.set(i.name, i);
			searchResults.set(i.name.replace(/-/g, " "), 'focusItem(\'' + i.name + '\')');
		}
		for (let i in j.encounters) {
			var e = j.encounters[i];
			encountersByName.set(e.area, i);
			searchResults.set(e.area.replace(/-/g, " "), 'focusEncounter(' + i + ')');
		}
		encounterPools = j.encounter_pools;
		for (let i in j.encounters) {
			addPoolInfo(j.encounters[i]);
		}

		var pokemonDataList;
		for (const p of pokemonByName.keys()) {
			pokemonDataList += `<option value="${fullCapitalize(p)}" />`
		}
		document.getElementById("pokemon-names-list").innerHTML = pokemonDataList;
		var itemDataList;
		for (const i of itemsByName.keys()) {
			itemDataList += `<option value="${fullCapitalize(i)}" />`
		}
		document.getElementById("item-names-list").innerHTML = itemDataList;
		var moveDataList;
		for (const m of movesByName.keys()) {
			moveDataList += `<option value="${fullCapitalize(m)}" />`
		}
		document.getElementById("move-names-list").innerHTML = moveDataList;

		for (let e of typeColors) {
			searchResults.set(e[0], `focusType('${e[0]}')`);
		}

		for (const t of j.trainers) {
			trainersByName.set(t.name, t);
		}
		for (let i in j.trainers) {
			searchResults.set(getTrainerName(j.trainers[i].name).toLowerCase(), `focusTrainer(${i})`);
		}
		data = j;
		var a = j.trainers[0].team[0];
		myPoke = JSON.parse(JSON.stringify(a));
		if (box.length > 0) {
			myPoke = box[0];
		}
		if (localStorage.getItem("last-trainer")) {
			var lt = parseInt(localStorage.getItem("last-trainer"));
			if (lt >= 0 && lt < j.trainers.length) {
				calcTrainer(lt);
			} else {
				calcTrainer(0);
			}
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
	});

	fetch("./fights.json")
	.then(response => response.text())
	.then(text => {
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
	});
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
	return false;
}