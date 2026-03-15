var vsRecorderStatus = 0; // 1 = connected, -1 = disconnected
var pingsWithoutResponse = 0;
var outstandingPingTimeout;

function readNewbox(bytes, start, db1, db2) {
	var pokemon = [];
	var banks = [];
	for (var i = 0; i < 3; i++) {
		var b = bytes[start + 0x14 + i];
		for (var j = 0; j < 8; j++) {
			banks.push((b & 1) == 1);
			b >>= 1;
		}
	}
	for (var i = 0; i < 20; i++) {
		var b = bytes[start + i];
		if (b == 0) {
			continue;
		}
		b--;
		var p = db1;
		if (banks[i]) {
			p = db2;
		}
		p += b * 0x2F;
		if (bytes[p + 0x1d] == 0xfd) { // Egg
			continue;
		}
		var item = bytes[p + 0x01];
		if (itemsById.has(item)) {
			item = itemsById.get(item);
		} else {
			item = "";
		}
		var atk = (bytes[p + 0x15] & 0xf0) >> 4;
		var def = (bytes[p + 0x15] & 0x0f);
		var spe = (bytes[p + 0x16] & 0xf0) >> 4;
		var spa = (bytes[p + 0x16] & 0x0f);
		var spd = spa
		var hp = 8 * (atk & 0b1) + 4 * (def & 0b1) + 2 * (spe & 0b1) + (spa & 0b1);
		var moves = [];
		for (var j = 0; j < 4; j++) {
			var move = bytes[p + 0x02 + j];
			if (movesByIndex.has(move)) {
				moves.push(movesByIndex.get(move).name);
			}
		}
		var caught = bytes[p + 0x1B] & 0b0111_1111;
		var landmark = landmarksByIndex.get(caught);
		if (!landmark) {
			landmark = "unknown";
		} else {
			landmark = landmark.name;
		}
		pokemon.push({
			name: pokemonByPokedex.get(bytes[p]).name,
			level: bytes[p + 0x1c],
			dvs: {
				"hp": hp,
				"atk": atk,
				"def": def,
				"spa": spa,
				"spd": spd,
				"spe": spe
			},
			"moves": moves,
			"item": item,
			"caught": landmark
		});
	}
	return pokemon;
}

function readPokemonList(bytes, start, capacity, increment) {
	var count = bytes[start];
	var p = start + 1;
	var species = [];
	for (var i = 0; i < count; i++) {
		species.push(bytes[p + i]);
	}
	/* Terminator was broken for a patch
	if (bytes[p + count] != 0xff) {
		return;
	}*/
	p += capacity + 1;
	var pokemon = [];
	for (var i = 0; i < count; i++) {
		species[i].level = bytes[p + 0x1f];
		if (bytes[p] != species[i]) { // Mismatching species or egg
			continue;
		}
		var item = bytes[p + 0x01];
		if (itemsById.has(item)) {
			item = itemsById.get(item);
		} else {
			item = "";
		}
		var atk = (bytes[p + 0x15] & 0xf0) >> 4;
		var def = (bytes[p + 0x15] & 0x0f);
		var spe = (bytes[p + 0x16] & 0xf0) >> 4;
		var spa = (bytes[p + 0x16] & 0x0f);
		var spd = spa
		var hp = 8 * (atk & 0b1) + 4 * (def & 0b1) + 2 * (spe & 0b1) + (spa & 0b1);
		var moves = [];
		for (var j = 0; j < 4; j++) {
			var move = bytes[p + 0x02 + j];
			if (movesByIndex.has(move)) {
				moves.push(movesByIndex.get(move).name);
			}
		}
		var caught = bytes[p + 0x1E] & 0b0111_1111;
		var landmark = landmarksByIndex.get(caught);
		if (!landmark) {
			landmark = "unknown";
		} else {
			landmark = landmark.name;
		}
		pokemon.push({
			name: pokemonByPokedex.get(bytes[p]).name,
			level: bytes[p + 0x1f],
			dvs: {
				"hp": hp,
				"atk": atk,
				"def": def,
				"spa": spa,
				"spd": spd,
				"spe": spe
			},
			"moves": moves,
			"item": item,
			"caught": landmark
		});
		p += increment;
	}
	return pokemon;
}

function parseBadges(badgeMask) {
	badges = 0;
	for (var i = 0; i < 16; i++) {
		if ((badgeMask & 1) == 1) {
			badges++;
		}
		badgeMask >>= 1;
	}
	document.getElementById("badges").value = badges;
	updateBadges();
}

function finishParse(title, pokemon, deadPokemon) {
	if (box.length > 0) {
		setPlayer(0);
	}
	updateBox();
	var popup = '<div onclick="closePopup()" class="save-success">' + title;
	popup += '<lb></lb>Encounters: ' + pokemon.length;
	if (deadPokemon.length > 0) {
		popup += ' (+' + deadPokemon.length + ' fainted)';
	}
	popup += '<lb></lb>Badges: ' + badges;
	popup += '</div>';
	document.getElementById("info-popup").innerHTML = popup;
}

function readFile(file) {
	var reader = new FileReader();
	reader.onload = function (e) {
		var bytes = new Uint8Array(e.target.result);
		if (file.name.endsWith(".sav") || file.name.endsWith(".dsv")) {
			try {
				box = readGen4Save(bytes);
				finishParse("Successfully parsed save!", box, []);
				return;
			} catch (e) {
				console.log(e);
			}
		}
		if (bytes.length > 32000 && bytes[0x2008] == 99 && bytes[0x2d0f] == 127) {
			try {
				var pokemon = [];
				var deadPokemon = [];
				pokemon = pokemon.concat(readPokemonList(bytes, 0x2865, 6, 48));
				for (var i = 0; i < 16; i++) {
					var l = readNewbox(bytes, 0x2f20 + i * 0x21, 0x4000, 0x6000);
					if (i >= 12) {
						deadPokemon = deadPokemon.concat(l);
					} else {
						pokemon = pokemon.concat(l);
					}
				}
				box = pokemon;
				deadBox = deadPokemon;
				parseBadges((bytes[0x23e5] << 8) | bytes[0x23e6]);
				finishParse("Successfully parsed save!", pokemon, deadPokemon);
			} catch (e) {
				console.log(e);
				document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">Error while parsing save!<lb></lb>Is this a valid file?<lb></lb>See console for details</div>';
			}
		} else {
			if (file.name.endsWith(".json")) {
				try {
					var text = new TextDecoder().decode(bytes);
					var j = JSON.parse(text);
					localStorage.setItem("calc/custom-data", text);
					document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-success">Successfully parsed JSON<lb></lb>Loaded as custom game</div>';
				} catch (e) {
					console.log(e);
					document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">Error while parsing JSON!<lb></lb>Is this a valid file?<lb></lb>See console for details</div>';
				}
				return;
			}
			console.log("File doesn't appear to be a save file!");
			console.log(bytes[0x2008]);
			console.log(bytes[0x2d0f]);
			document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">File doesn\'t appear to be a save file!<lb></lb>Name should end with .sav</div>';
		}
	};
	reader.readAsArrayBuffer(file);
}

function hexToBytes(hex) {
    var bytes = [];
    for (var c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

function readGen4Save(bytes) {
	var pokemon = [];
	for (var i = 0; i < 6; i++) {
		var mon = readGen4Mon(bytes, 0x40000 + 0xA0 + 236 * i);
		if (mon) {
			pokemon.push(mon);
		}
	}
	for (var a = 0; a < 18 * 30; a++) {
		var mon = readGen4Mon(bytes, 0x0CF2C + 0x04 + 136 * a);
		if (mon) {
			pokemon.push(mon);
		}
	}
	return pokemon;
}

function copySlice(arr, start, length) {
	var ret = [];
	for (var i = 0; i < length; i++) {
		ret.push(arr[start + i])
	}
	return ret
}

function readGen4Mon(bytes, offset) {
	var personality = read32(bytes, offset);
	var encrypted = copySlice(bytes, offset + 8, 128);
	var decrypted = gen4DecryptMon(encrypted, read16(bytes, offset + 6), 128);
	var parts = unshuffleParts([
		copySlice(decrypted, 32 * 0, 32),
		copySlice(decrypted, 32 * 1, 32),
		copySlice(decrypted, 32 * 2, 32),
		copySlice(decrypted, 32 * 3, 32)
	], ((personality & 0x3e000) >> 13) % 24);
	var blockA = parseTemplate(parts[0], 0, [
		2, "species",
		2, "item",
		2, "otId",
		2, "secretId",
		4, "experience",
		1, "friendship",
		1, "ability",
		1, "markings",
		1, "language",
		1, "hpEv",
		1, "atkEv",
		1, "defEv",
		1, "speEv",
		1, "spaEv",
		1, "spdEv",
		1, "cool",
		1, "beauty",
		1, "cute",
		1, "smart",
		1, "tough",
		1, "sheen",
		4, "sinnohRibbons1"
	]);
	var blockB = parseTemplate(parts[1], 0, [
		[2, 4], "moves",
		[1, 4], "pp",
		4, "hoennRibbons", // PK swapped hoennRibbons and ivs just to fuck with me
		4, "ivs",
		1, "form",
		1, "leaves",
		2, "unused",
		2, "eggLocationPlatinum",
		2, "metLocationPlatinum"
	]);
	var blockC = parseTemplate(parts[1], 0, [
		[2, 11], "nickname",
		1, "unused",
		1, "game",
		4, "sinnohRibbons2",
		4, "unused"
	]);
	var blockD = parseTemplate(parts[1], 0, [
		[2, 8], "otName",
		3, "eggReceivedDate",
		3, "metDate",
		2, "eggLocationDP",
		2, "metLocationDP",
		1, "pokerus",
		1, "pokeball",
		1, "metLevel",
		1, "encounterType",
		1, "ballHGSS",
		1, "walkingMood"
	]);
	var nature = [
		"hardy",
		"lonely",
		"brave",
		"adamant",
		"naughty",
		"bold",
		"docile",
		"relaxed",
		"impish",
		"lax",
		"timid",
		"hasty",
		"serious",
		"jolly",
		"naive",
		"modest",
		"mild",
		"quiet",
		"bashful",
		"rash",
		"calm",
		"gentle",
		"sassy",
		"careful",
		"quirky",
	][personality % 25];
	var species = pokemonByPokedex.get(blockA.species);
	if (species == undefined) {
		return null;
	}
	return {
		name: species.name,
		moves: blockB.moves.map(v => movesByIndex.get(v)?.name).filter(a => a != undefined),
		item: "", // TODO blockA.item,
		ability: abilitiesByIndex.get(blockA.ability)?.name ?? undefined,
		dvs: {
			hp: (blockB.ivs >> 0) & 0b11111,
			atk: (blockB.ivs >> 5) & 0b11111,
			def: (blockB.ivs >> 10) & 0b11111,
			spa: (blockB.ivs >> 20) & 0b11111,
			spd: (blockB.ivs >> 25) & 0b11111,
			spe: (blockB.ivs >> 15) & 0b11111,
		},
		nature: nature,
		level: getLevelFromExperience(species, blockA.experience),
		experience: blockA.experience,
	};
}

function getLevelFromExperience(mon, experience) {
	if (!mon.name) {
		mon = pokemonByName.get(mon);
	}
	var growth = mon.growth;
	var level = 1;
	var arr = data.growth[growth];
	while (level + 1 < arr.length) {
		if (arr[level + 1] > experience) {
			break;
		}
		level++;
	}
	return level;

}

function gen4DecryptMon(bytes, seed, size) {
	var ret = [];
	seed = BigInt(seed);
	for (var i = 0; i < size / 2; i++) {
		seed = ((BigInt(0x41C64E6D) * seed) + BigInt(0x6073)) & BigInt(0xffffffff);
		var next = Number(seed);
		var v = read16(bytes, i * 2)
		v = v ^ (next >> 16);
		ret.push((v >> 0) & 0xff);
		ret.push((v >> 8) & 0xff);
	}
	return ret;
}

function unshuffleParts(parts, variant) {
	var ordering = [
		[0, 1, 2, 3],
		[0, 1, 3, 2],
		[0, 2, 1, 3],
		[0, 3, 1, 2],
		[0, 2, 3, 1],
		[0, 3, 2, 1],
		[1, 0, 2, 3],
		[1, 0, 3, 2],
		[2, 0, 1, 3],
		[3, 0, 1, 2],
		[2, 0, 3, 1],
		[3, 0, 2, 1],
		[1, 2, 0, 3],
		[1, 3, 0, 2],
		[2, 1, 0, 3],
		[3, 1, 0, 2],
		[2, 3, 0, 1],
		[3, 2, 0, 1],
		[1, 2, 3, 0],
		[1, 3, 2, 0],
		[2, 1, 3, 0],
		[3, 1, 2, 0],
		[2, 3, 1, 0],
		[3, 2, 1, 0]
	][variant];
	return [parts[ordering[0]], parts[ordering[1]], parts[ordering[2]], parts[ordering[3]]];
}

function readN(bytes, offset, size) {
	if (size == 1) {
		return bytes[offset];
	} else if (size == 2) {
		return read16(bytes, offset);
	} else if (size == 3) {
		return read24(bytes, offset);
	} else if (size == 4) {
		return read32(bytes, offset)
	}
}

function read32(bytes, offset) {
	return (bytes[offset + 0] << 0) +
		(bytes[offset + 1] << 8) +
		(bytes[offset + 2] << 16) +
		(bytes[offset + 3] * Math.pow(2, 24));
}

function read24(bytes, offset) {
	return (bytes[offset + 0] << 0) +
		(bytes[offset + 1] << 8) +
		(bytes[offset + 2] << 16);
}

function read16(bytes, offset) {
	return (bytes[offset + 0] << 0) +
		(bytes[offset + 1] << 8);
}

function parseTemplate(bytes, offset, template) {
	var ret = {};
	for (var i = 0; i < template.length; i++) {
		var size = template[i++];
		var key = template[i]
		var value = bytes[offset];
		if (Array.isArray(size)) {
			value = [];
			var aSize = size[0];
			var aLength = size[1];
			for (var a = 0; a < aLength; a++) {
				value.push(readN(bytes, offset, aSize));
				offset += aSize;
			}
		} else {
			value = readN(bytes, offset, size);
			offset += size;
		}
		ret[key] = value;
	}
	return ret;
}

function vsRecorderComplete(event) {
	try {
		connectToVsRecorder();
		var response = event.target.responseText;
		var values = [...response.matchAll(/(\w+)\:\s*(.+)/g)];
		var obj = {}
		for (const v of values) {
			obj[v[1]] = v[2]
		}
		var pokemon = [];
		var deadPokemon = [];
		pokemon = pokemon.concat(readPokemonList(hexToBytes(obj.Party), 0, 6, 48));
		var newboxBytes = hexToBytes(obj.NewboxMetadata);
		var db1 = newboxBytes.length;
		newboxBytes = newboxBytes.concat(hexToBytes(obj.NewboxDatabase1));
		var db2 = newboxBytes.length;
		newboxBytes = newboxBytes.concat(hexToBytes(obj.NewboxDatabase2));
		for (var i = 0; i < 16; i++) {
			var l = readNewbox(newboxBytes, 0x00 + i * 0x21, db1, db2);
			if (i >= 12) {
				deadPokemon = deadPokemon.concat(l);
			} else {
				pokemon = pokemon.concat(l);
			}
		}
		box = pokemon;
		deadBox = deadPokemon;
		var inventoryBytes = hexToBytes(obj.InventoryData);
		parseBadges((inventoryBytes[0x0F] << 8) | inventoryBytes[0x10]);
		finishParse("Successfully read Vs. Recorder!", pokemon, deadPokemon);
	} catch (e) {
		console.log(e);
		document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">Error while parsing Vs. Recorder!<lb></lb>See console for details</div>';
	}
}

function vsRecorderFailed(event) {
	console.log(event);
	document.getElementById("info-popup").innerHTML = '<div onclick="closePopup()" class="save-error">Request for data failed!<lb></lb>Is Vs. Recorder running?</div>';
}

function updateVsRecorder() {
	var req = new XMLHttpRequest();
	req.addEventListener("load", vsRecorderComplete);
	req.addEventListener("error", vsRecorderFailed);
	req.addEventListener("abort", vsRecorderFailed);
	req.open("GET", "http://localhost:31123/update");
	req.send();
}

function vsRecorderPingComplete(event) {
	connectToVsRecorder();
	clearTimeout(outstandingPingTimeout);
}

function vsRecorderPingFailed(event) {
	clearTimeout(outstandingPingTimeout);
}

function pingVsRecorder() {
	var req = new XMLHttpRequest();
	req.addEventListener("load", vsRecorderPingComplete);
	req.addEventListener("error", vsRecorderPingFailed);
	req.addEventListener("abort", vsRecorderPingFailed);
	req.open("GET", "http://localhost:31123/ping");
	req.send();
	outstandingPingTimeout = setTimeout(function() {
		vsRecorderPingFailed(null);
		req.abort();
	}, 1000);
}

function connectToVsRecorder() {
	pingsWithoutResponse = 0;
	if (vsRecorderStatus != 1) {
		vsRecorderStatus = 1;
		document.getElementById("update-vs-recorder").classList.remove("vs-recorder-polling");
		document.getElementById("update-vs-recorder").classList.remove("vs-recorder-disconnected");
	}
}

setInterval(function() {
	if (!settings.enableVsRecorder) {
		return;
	}
	if ((pingsWithoutResponse & (pingsWithoutResponse - 1)) == 0) {
		pingVsRecorder();
	}
	pingsWithoutResponse++;
	if (pingsWithoutResponse >= 3) {
		if (vsRecorderStatus != -1) {
			vsRecorderStatus = -1;
			document.getElementById("update-vs-recorder").classList.remove("vs-recorder-polling");
			document.getElementById("update-vs-recorder").classList.add("vs-recorder-disconnected");
		}
	}
}, 1000);
connectToVsRecorder();