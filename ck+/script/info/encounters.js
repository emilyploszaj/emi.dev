var encounterIcons = new Map([
	["walking", "images/encounters/walking.png"],
	["rock", "images/encounters/rock_smash.png"],
	["bug-catching-contest", "images/items/silverpowder.png"],
	["surfing", "images/encounters/surfing.png"],
	["old-rod", "images/items/old_rod.png"],
	["good-rod", "images/items/good_rod.png"],
	["super-rod", "images/items/super_rod.png"],
	["static", "images/items/leftovers.png"],
	["headbutt", "images/encounters/headbutt.png"],
	["gift", "images/items/master_ball.png"],
	["swarm", "images/encounters/swarm.png"],
	["swarm-old-rod", "images/encounters/swarm_old_rod.png"],
	["swarm-good-rod", "images/encounters/swarm_good_rod.png"],
	["swarm-super-rod", "images/encounters/swarm_super_rod.png"],
	["trade", "images/items/exp_share.png"],
	["buy", "images/items/coin_case.png"]
]);

function inflateEncounterPool(p) {
	if (typeof p === "string") {
		var pool = encounterPools;
		for (let part of p.split(/\./)) {
			pool = pool[part];
		}
		return pool;
	}
	return p;
}

function addPoolList(map, name, t, p) {
	if (name == "national-park") {
		console.log(t, p);
	}
	p = inflateEncounterPool(p);
	if (!Array.isArray(p)) {
		var keys = Object.keys(p);
		for (let key of keys) {
			addPoolList(map, name, t, p[key]);
		}
	} else {
		for (var i = 0; i < p.length; i++) {
			var pp = p[i];
			var poke = pp.pokemon;
			if (!map.has(poke)) {
				map.set(poke, new Map());
			}
			var areas = map.get(poke);
			if (!areas.has(name)) {
				areas.set(name, []);
			}
			areas.get(name).push({ chance: pp.chance, type: t });
		}
	}
}

function addPoolInfo(pools) {
	var name = pools.area;
	for (let p of pools.pools) {
		addPoolList(pokemonEncounters, name, p.type, p.pool)
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
		v += "<h6>Areas</h6>";
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
	if (pools.area && pools.pools) {
		var tabHeader = "";
		var tabBody = "";
		for (let pool of pools.pools) {
			tabHeader += `<div class="tab-button" onclick="selectTab(event)"><img src="${encounterIcons.get(pool.type)}">${fullCapitalize(pool.type)}</div>`;
			tabBody += `<div class="tab-contents">${getEncounterPoolGroupDisplay(pool.pool)}</div>`;
		}
		v += selectTabInDisplay(`
		<div class="tab-collection">
			<div class="tab-header">
				${tabHeader}
			</div>
			<div class="scroll-padding-anchor"></div>
			<div class="tab-body">
				${tabBody}
			</div>
		</div>`, 0);
	}
	return v;
}

function arePoolsEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

function trimLevelFromPool(p) {
	p = JSON.parse(JSON.stringify(p));
	if (p.pool.level) {
		delete p.pool.level;
	} else {
		for (let key of Object.keys(p.pool)) {
			if (p.pool[key].level) {
				delete p.pool[key].level;
			}
		}
	}
	return p;
}

function arePoolsEqualIgnoreLevel(a, b) {
	return arePoolsEqual(trimLevelFromPool(a), trimLevelFromPool(b));
}

function getEncounterPoolGroupDisplay(p) {
	p = inflateEncounterPool(p);
	if (Array.isArray(p)) {
		return `<h6>(Lvl ${p[0].level}):</h6>${getEncounterPoolDisplay(p, "any")}`;
	}
	var keys = Object.keys(p);
	var v = `<h6>(Lvl ${p[keys[0]][0].level})</h6>`;
	for (var i = 1; i < keys.length; i++) {
		if (!arePoolsEqual(keys[i], keys[0])) {
			for (let key of keys) {
				v += getEncounterPoolDisplay(p[key], key);
			}
			return v;
		}
	}
	return v + getEncounterPoolDisplay(p.day, "any");
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

function getPoolOfType(area, type) {
	var pools = data.encounters[encountersByName.get(area)].pools;
	for (let pool of pools) {
		if (pool.type == type) {
			return pool;
		}
	}
	return null;
}

function getUniqueEncountersForPokemon(p) {
	var encounters = pokemonEncounters.get(p.name);
	if (encounters) {
		var condense = new Map();
		for (const en of encounters.entries()) {
			var area = en[0];
			var parts = en[1];
			var types = new Set();
			partsLabel:
			for (var i = 0; i < parts.length; i++) {
				var type = parts[i].type;
				if (!types.has(type)) {
					types.add(type);
					if (!condense.has(type)) {
						condense.set(type, []);
					}
					var pool = getPoolOfType(area, type);
					for (let c of condense.get(type)) {
						if (arePoolsEqualIgnoreLevel(c.pool, pool)) {
							c.areas.push(area);
							continue partsLabel;
						}
					}
					condense.get(type).push({
						"areas": [area],
						"pool": pool
					});
				}
			}
		}
		return condense;
	}
}
