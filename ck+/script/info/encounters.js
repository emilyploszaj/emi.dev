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
			} else if (pool.type == "bug-catching-contest") {
				addPoolList(pokemonEncounters, name, "Bug Catching Contest", pool.pool);
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
	if (landmark.items.length > 0) {
		v += "<lb></lb><details><summary>Items</summary>";
		for (var j = 0; j < landmark.items.length; j++) {
			v += getItemLocationDescription(landmark.items[j]) + "<lb></lb>";
		}
		v += "</details>";
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
				} else if (pool.type == "bug-catching-contest") {
					v += "<p>Bug Catching Contest:</p>";
					v += getEncounterPoolDisplay(pool.pool, "any");
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
	v += '<div style="display:flex;flex-wrap:wrap;">';
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
			+ '\')" src="' + getPokeImage(pool[i].pokemon, i) + '">';
		v += '<div class="wild-calc"><button onclick="calcWild(' + pokemonByName.get(pool[i].pokemon).pokedex + ', ' + pool[i].level + ')">Calc</button></div>';
		v += '</div>';
	}
	v += '</div>';
	v += '</div>';
	return v;
}