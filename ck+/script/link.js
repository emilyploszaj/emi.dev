var lookupHistory = [];

function addHistory(name, link) {
	lookupHistory = lookupHistory.filter((h) => h.name != name && h.link != link);
	lookupHistory = [{"name": name, "link": link}].concat(lookupHistory);
	updateHistory();
}

function updateHistory() {
	var v = "";
	for (var i = 0; i < lookupHistory.length; i++) {
		var h = lookupHistory[i];
		v += `<button onclick="lookupHistory[${i}].link()">${h.name}</button>`
	}
	document.getElementById("history").innerHTML = v;
}

function focusLandmark(i) {
	var d = encountersByName.get(landmarksByIndex.get(i).locations[0]);
	if (d !== undefined) {
		focusEncounter(d);
	} else {
		addHistory(fullCapitalize(landmarksByIndex.get(i).name), () => focusLandmark(i));
		document.getElementById("full-encounter").innerHTML = getEncounterDisplay(landmarksByIndex.get(i).name);
		setTab("full-encounter");
	}
}

function focusEncounter(i) {
	addHistory(fullCapitalize(data.encounters[i].area), () => focusEncounter(i));
	document.getElementById("search-box").value = "";
	updateSearch("");
	document.getElementById("full-encounter").innerHTML = getEncounterDisplay(data.encounters[i]);
	setTab("full-encounter");
}

function focusItem(i) {
	addHistory(fullCapitalize(i), () => focusItem(i));
	document.getElementById("search-box").value = "";
	updateSearch("");
	document.getElementById("full-item").innerHTML = getFullItemDisplay(i);
	setTab("full-item");
}

function focusMove(i) {
	addHistory(fullCapitalize(movesByIndex.get(i).name), () => focusMove(i));
	document.getElementById("search-box").value = "";
	updateSearch("");
	document.getElementById("full-move").innerHTML = getFullMoveDisplay(movesByIndex.get(i));
	setTab("full-move");
}

function focusType(i) {
	addHistory(fullCapitalize(i), () => focusType(i));
	document.getElementById("search-box").value = "";
	updateSearch("");
	document.getElementById("full-type").innerHTML = getFullTypeDisplay(i);
	setTab("full-type");
}

function statCheckCurrentTrainer() {
	focusTrainer(lastTrainer);
}

function focusTrainer(i) {
	addHistory(getTrainerName(data.trainers[i].name), () => focusTrainer(i));
	document.getElementById("search-box").value = "";
	updateSearch("");
	document.getElementById("full-trainer").innerHTML = getTrainerStats(i);
	setTab("full-trainer");
}

function focusPokeByName(name) {
	focusPokemon(pokemonByName.get(name).pokedex);
}

function focusPokemon(i) {
	addHistory(fullCapitalize(pokemonByPokedex.get(i).name), () => focusPokemon(i));
	document.getElementById("search-box").value = "";
	updateSearch("");
	displayPokemon(document.getElementById("main-poke"), i);
	setTab("full-poke");
}

function pokeLink(p) {
	var name = p;
	if (p.name) {
		name = p.name;
	}
	return '<span class="poke-link" onclick="focusPokeByName(\'' + name + '\')">' + fullCapitalize(name) + '</span>'
}

function prettyType(t) {
	return `<div class="type" onclick="focusType('${t}')" style="background-color:${typeColor(t)};">${fullCapitalize(t)}</div>`;
}

function typeColor(t) {
	return typeColors.get(t);
}

function itemLink(item) {
	if (item.length == 0 || item == "no-item") {
		return "";
	}
	item = item.replace(" ", "-");
	return '<span class="poke-link" onclick="focusItem(\'' + item + '\')">' + itemImage(item) + fullCapitalize(item) + '</span>'
}

function itemImage(item) {
	item = item.replace(" ", "-");
	return `<img class="item-icon" src="./images/items/${item.replace("-", "_")}.png">`;
}

function landmarkLink(landmark) {
	return '<span class="poke-link" onclick="focusLandmark(' + landmark.id + ')">' + fullCapitalize(landmark.name) + '</span>'
}

function moveLink(move) {
	if (move.name) {
		move = move.name;
	}
	var i = movesByName.get(move).index;
	return '<span class="poke-link" onclick="focusMove(' + i + ')">' + fullCapitalize(move) + '</span>'
}

function calcWild(p, level) {
	p = pokemonByPokedex.get(p);
	var moves = [];
	for (var i = p.learnset.length - 1; i >= 0; i--) {
		var l = p.learnset[i];
		if (l.level <= level) {
			moves.push(l.move);
		}
	}
	if (moves.length > 4) {
		moves = moves.splice(0, 4).reverse();
	}
	theirPoke = {
		"name": p.name,
		"item": "",
		"level": level,
		"dvs": {
			"hp": 0,
			"atk": 15,
			"def": 0,
			"spa": 15,
			"spd": 0,
			"spe": 15
		},
		"moves": moves
	}
	updateCalc();
	setTab("calc");
}