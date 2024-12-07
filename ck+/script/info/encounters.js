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
			v += `<div>${areaLink(landmark.locations[i])}</div>`;
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
	var rawKeys = Object.keys(p);
	var keys = [];
	if (rawKeys.includes("morning")) {
		keys.push("morning");
		rawKeys.splice(rawKeys.indexOf("morning"), 1);
	}
	if (rawKeys.includes("day")) {
		keys.push("day");
		rawKeys.splice(rawKeys.indexOf("day"), 1);
	}
	if (rawKeys.includes("night")) {
		keys.push("night");
		rawKeys.splice(rawKeys.indexOf("night"), 1);
	}
	keys = keys.concat(rawKeys);
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
		var extraClasses = undefined;
		if (family) {
			extraClasses = "dupe-encounter";
		} else {
			adjustedPercent = parseInt(pool[i].chance / totalWeight * 10000) / 100 + "%";
		}
		var tt = "";
		if (pool[i].extra) {
			tt += ' <div class="extra-info" title="' + pool[i].extra + '">?</div>';
		}

		var header = '<div><ruby>' + percent + '%' + tt + '<rt>(' + adjustedPercent + ')';
		if (showLevel) {
			header += " Lvl " + pool[i].level;
		}
		header += '</rt></ruby></div>';
		var footer = '<div class="wild-calc"><button onclick="calcWild(' + pokemonByName.get(pool[i].pokemon).pokedex + ', ' + pool[i].level + ')">Calc</button></div>';
		v += getEncounterPoke(pool[i].pokemon, header, footer, extraClasses);
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

function getRelativeEncounterChances(poke) {
	var encounters = pokemonEncounters.get(orElse(poke.name, poke));
	var ret = {};
	if (encounters) {
		for (const en of encounters.entries()) {
			var area = en[0];
			var pools = data.encounters[encountersByName.get(area)].pools;
			ret[area] = {};
			for (const p of pools) {
				var pool = inflateEncounterPool(p.pool);
				var bestChance = 0;
				var bestDupeChance = 0;
				if (Array.isArray(pool)) {
					pool = [pool];
				} else {
					pool = Object.values(pool);
				}
				for (const time of pool) {
					var chance = 0;
					var totalChance = 0;
					for (const m of time) {
						if (m.pokemon == poke) {
							chance += m.chance;
						} else if (hasFamily(pokemonFamilies.get(pokemonByName.get(m.pokemon).pokedex))) {
							continue;
						}
						totalChance += m.chance;
					}
					var dupeChance = chance / totalChance * 100;
					dupeChance = parseInt(dupeChance / 100 * 10000) / 100;
					if (totalChance > 0 && dupeChance > bestDupeChance) {
						bestChance = chance;
						bestDupeChance = dupeChance;
					}
				}
				if (bestChance > 0) {
					ret[area][p.type] = {base: bestChance, dupe: bestDupeChance};
				}
			}
		}
	}
	return ret;
}
