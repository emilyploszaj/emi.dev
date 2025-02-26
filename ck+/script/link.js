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

function getLinkState() {
	var state = {
		tabs: []
	}
	for (const tc of document.getElementsByClassName("tab-collection")) {
		var tabData = {};
		var i = 0;
		for (const tab of tc.getElementsByClassName("tab-button")) {
			if (tab.classList.contains("selected-tab-button")) {
				tabData.selected = i;
				break;
			}
			i++;
		}
		state.tabs.push(tabData);
	}
	return state;
}

function applyLinkState(state) {
	if (state.tabs) {
		var i = 0;
		for (const tc of document.getElementsByClassName("tab-collection")) {
			if (state.tabs[i] && state.tabs[i].selected) {
				var j = 0;
				for (const tab of tc.getElementsByClassName("tab-button")) {
					if (j == state.tabs[i].selected) {
						tab.classList.add("selected-tab-button")
					} else {
						tab.classList.remove("selected-tab-button")
					}
					j++;
				}
				j = 0;
				for (const p of tc.getElementsByClassName("tab-contents")) {
					if (j == state.tabs[i].selected) {
						p.style.display = "block";
					} else {
						p.style.display = "none";
					}
					j++;
				}
			}
			i++;
		}
	}
}

function updateLinkState() {
	history.replaceState(getLinkState(), "", window.location.hash);
}

function clickLink(event) {
	var path = event.target.closest("a").href;
	path = path.substring(path.indexOf("#"));
	// There is no better API for determining if the user is attempting to open page in a new tab. Oh well.
	if (!event.ctrlKey && !event.shiftKey) {
		event.preventDefault();
		var hash = path;
		if (hash != window.location.hash) {
			history.replaceState(getLinkState(), "", window.location.hash);
			navigate(hash);
			if (hash.endsWith("#/calc/")) {
				hash = window.location.href.split("#")[0];
			}
			history.pushState(getLinkState(), "", hash);
		}
	}
}

function navigate(url) {
	var parts = url.split("/");
	for (var i = 0; i < parts.length; i++) {
		if (!parts[i]) {
			parts.splice(i, 1);
		}
	}
	if (parts.length > 0 && parts[0] == "#") {
		parts.splice(0, 1);
		if (parts.length >= 2) {
			if (parts[0] == "pokemon") {
				displayPokemon(document.getElementById("main-poke"), pokemonByName.get(parts[1]).pokedex);
				setTab("full-poke");
			} else if (parts[0] == "item") {
				document.getElementById("full-page").innerHTML = getFullItemDisplay(parts[1]);
				setTab("full-page");
			} else if (parts[0] == "move") {
				document.getElementById("full-page").innerHTML = getFullMoveDisplay(movesByName.get(parts[1]));
				setTab("full-page");
			} else if (parts[0] == "type") {
				document.getElementById("full-page").innerHTML = getFullTypeDisplay(parts[1]);
				setTab("full-page");
			} else if (parts[0] == "area") {
				document.getElementById("full-page").innerHTML = getEncounterDisplay(data.encounters[encountersByName.get(parts[1])]);
				setTab("full-page");
			} else if (parts[0] == "trainer") {
				document.getElementById("full-page").innerHTML = getTrainerStats(trainersByName.get(parts[1]));
				setTab("full-page");
			}
		} else if (parts.length >= 1) {
			if (parts[0] == "calc") {
				setTab("calc");
			} else if (parts[0] == "box") {
				setTab("box")
			} else if (parts[0] == "trainers") {
				setTab("trainers")
			} else if (parts[0] == "map") {
				setTab("map")
			}
		}
	} else {
		setTab("calc");
	}
}

addEventListener("popstate", function(event) {
	navigate(window.location.hash);
	var state = event.state;
	if (state) {
		applyLinkState(state);
	}
});

function createLink(path, text) {
	return `<a class="poke-link" href="${path}" onclick="clickLink(event)">${text}</a>`;
}

function customLink(path, params, text) {
	return `<a ${params} href="${path}" onclick="clickLink(event)">${text}</a>`;
}

function pokeLink(p) {
	var name = p;
	if (p.name) {
		name = p.name;
	}
	return createLink(`#/pokemon/${name}/`, fullCapitalize(name));
}

function prettyType(t) {
	return createLink(`#/type/${t}/`, unlinkedTypeIcon(t));
}

function unlinkedTypeIcon(t) {
	return `<div class="type" style="background-color:${typeColor(t)};">${fullCapitalize(t)}</div>`;
}

function getTypeEmblem(type) {
	color = typeColors.get(type);
	return `<span class="move-emblem" style="background-color:${color};"></span>`;
}

function typeColor(t) {
	return typeColors.get(t);
}

function itemLink(item) {
	if (item.name) {
		item = item.name;
	}
	if (item.length == 0 || item == "no-item") {
		return "";
	}
	item = item.replace(" ", "-");
	return createLink(`#/item/${item}/`, prettyItem(item));
}

function prettyItem(item) {
	if (item.name) {
		item = item.name;
	}
	if (item.length == 0 || item == "no-item") {
		return "";
	}
	item = item.replace(" ", "-");
	return itemImage(item) + fullCapitalize(item);
}

function itemImage(item) {
	if (item.name) {
		item = item.name;
	}
	item = item.replace(" ", "-");
	if (item.startsWith("tm-") || item.startsWith("hm-")) {
		item = "tm_hm"
	}
	return `<img class="item-icon" src="./images/items/${item.replace("-", "_")}.png">`;
}

function landmarkLink(landmark) {
	if (landmark.locations.length > 0) {
		return areaLink(landmark.locations[0]);
	} else {
		return fullCapitalize(landmark.name);
	}
}

function areaLink(location) {
	return createLink(`#/area/${location}/`, fullCapitalize(location));
}

function moveLink(move) {
	if (move.name) {
		move = move.name;
	}
	return createLink(`#/move/${move}/`, fullCapitalize(move));
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