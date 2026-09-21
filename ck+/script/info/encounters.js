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
	["buy", "images/items/coin_case.png"],
	["global-honey-tree", "images/encounters/global_honey_tree.png"],
	["local-honey-tree", "images/encounters/local_honey_tree.png"],
]);

const WARNING_FLAGS = ["self-ko", "recoil", "trapping", "teleport", "phazing"];

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
	if (landmark) {
		var center = getMapCenter(landmark);
		var v = "";
		var w = 320;
		var h = 280;
		var scale = 40;
		v += '<div>';
		v += '<div class="encounter-minimap">' + getMapDisplay(w, h, -center.x + w / scale / 2, -center.y + h / scale / 2, scale, landmark.name) + '</div>';
	}
	if (pools.area) {
		v += "<h3>" + fullCapitalize(pools.area) + "</h3>";
		if (landmark) {
			v += "<h6>Areas</h6>";
			for (var i = 0; i < landmark.locations.length; i++) {
				v += `<div>${areaLink(landmark.locations[i])}</div>`;
			}
		}
	} else {
		v += "<h3>" + fullCapitalize(pools) + "</h3>";
	}
	if (landmark && landmark.items.length > 0) {
		v += "<lb></lb><details><summary>Items</summary>";
		v += getLocationItemDisplay(landmark);
		v += "</details>";
	}
	v += '<br style="clear:both;"/></div>';
	if (pools.area && pools.pools?.length > 0) {
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
		p = { any: p };
	}
	var rawKeys = Object.keys(p);
	var keys = [];
	var keyOrdering = ["morning", "day", "night", "fantina", "maylene", "wake", "byron", "candice", "volkner"];
	for (const ko of keyOrdering) {
		if (rawKeys.includes(ko)) {
			keys.push(ko);
			rawKeys.splice(rawKeys.indexOf(ko), 1);
		}
	}
	keys = keys.concat(rawKeys);

	var levels = LevelRange.empty();
	for (const k of keys) {
		for (const e of p[k]) {
			levels.expand(e.level);
		}
	}

	var v = `<h6>(Lvl ${levels.display()})</h6>`;
	for (var i = 1; i < keys.length; i++) {
		if (!arePoolsEqual(p[keys[i]], p[keys[0]])) {
			for (let key of keys) {
				v += getEncounterPoolDisplay(p[key], key, levels.size() > 1);
			}
			return v;
		}
	}
	return v + getEncounterPoolDisplay(p[keys[0]], "any", levels.size() > 1);
}

function getEncounterPoolDisplay(pool, time, showLevel) {
	if (time != "day" && time != "night" && time != "morning") {
		time = "any";
	}
	var v = "";
	v += '<div class="encounter-pool ' + time + '-pool">';
	v += '<div style="display:flex;flex-wrap:wrap;">';
	var totalWeight = 0;
	for (var i = 0; i < pool.length; i++) {
		if (!hasFamily(pokemonFamilies.get(pokemonByName.get(pool[i].pokemon).pokedex))) {
			totalWeight += pool[i].chance;
		}
	}
	for (var i = 0; i < pool.length; i++) {
		var mon = pokemonByName.get(pool[i].pokemon);
		var family = hasFamily(pokemonFamilies.get(mon.pokedex));
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
			tt += ` <div class="note tooltip-container">?<div class="tooltip">${pool[i].extra}</div></div>`;
		}

		var level = LevelRange.of(pool[i].level);

		var header = '<div class="encounter-chance"><ruby>' + percent + '%' + tt + '<rt>(' + adjustedPercent + ')</rt></ruby></div>';
		if (showLevel) {
			header += `<div class="encounter-level">Lvl ${level.display()}</div>`;
		}

		// Warnings
		var warnings = undefined;
		var warningTypes = new Map();
		for (const l of level) {
			for (const m of getLearnsetAtLevel(mon.learnset, l)) {
				for (const w of WARNING_FLAGS) {
					if ((movesByName.get(m).flags ?? []).indexOf(w) != -1) {
						if (!warningTypes.has(w)) {
							warningTypes.set(w, new Map());
						}
						var mm = warningTypes.get(w);
						if (!mm.has(m)) {
							mm.set(m, []);
						}
						mm.get(m).push(l);
					}
				}
			}
		}
		if (warningTypes.size > 0) {
			warnings = `<div class="encounter-warnings">`;
			for (const warning of warningTypes.keys()) {
				var text = `${fullCapitalize(warning)} Moves`;
				var mm = warningTypes.get(warning);
				for (const m of mm.keys()) {
					var mmRanges = LevelRange.flatten(mm.get(m));
					if (mmRanges.length == 1 && mmRanges[0].min == level.min && mmRanges[0].max == level.max) {
						text += `<br><span class="meek">${fullCapitalize(m)}</span>`;
					} else {
						for (const mmRange of mmRanges) {
							text += `<br><span class="meek">${fullCapitalize(m)} (Lvl ${mmRange.display()})</span>`;
						}
					}
				}
				warnings += `<div class="tooltip-container encounter-warning"><img src="./images/encounter-warnings/${warning}.png"><div class="tooltip">${text}</div></div>`;
			}
			warnings += `</div>`;
		}

		var footer = (warnings ?? "") + `<div class="wild-calc"><button onclick="calcWild(${pokemonByName.get(pool[i].pokemon).pokedex}, ${level.min})">Calc</button></div>`;
		v += getEncounterPoke(pool[i].pokemon, header, footer, extraClasses, i);
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
	var encounters = pokemonEncounters.get(poke.name ?? poke);
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
				var bestRange = range;
				if (Array.isArray(pool)) {
					pool = [pool];
				} else {
					pool = Object.values(pool);
				}
				for (const time of pool) {
					var chance = 0;
					var totalChance = 0;
					var range = LevelRange.empty();
					for (const m of time) {
						if (m.pokemon == poke) {
							chance += m.chance;
							range.expand(m.level);
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
						bestRange = range;
					}
				}
				if (bestChance > 0) {
					ret[area][p.type] = {base: bestChance, dupe: bestDupeChance, level: bestRange};
				}
			}
		}
	}
	return ret;
}
