function updateEdit() {
	if (editing == -1) {
		document.getElementById("save-poke").style.display = "none";
		document.getElementById("add-poke").style.display = "block";
	} else {
		document.getElementById("save-poke").style.display = "block";
		document.getElementById("add-poke").style.display = "none";
	}
	var poke = getEditedPoke();
	if (poke && copyEditedMoves) {
		var p = pokemonByName.get(poke.name);
		var moves = [];
		for (var i = p.learnset.length - 1; i >= 0; i--) {
			var l = p.learnset[i];
			if (l.level <= poke.level) {
				moves.push(l.move);
			}
		}
		for (var i = 1; i <= 4; i++) {
			var mi = Math.min(moves.length, 4) - i;
			if (mi >= 0) {
				document.getElementById("edit-move-" + i).value = getMoveName(moves[mi]);
			} else {
				document.getElementById("edit-move-" + i).value = "";
			}
		}
		poke = getEditedPoke();
	}
	if (poke) {
		displayCalcPokemon(document.getElementById("edited-poke"), poke, undefined, false);
		var hp = getHiddenPower(poke);
		document.getElementById("edit-hidden-power").innerHTML = `${fullCapitalize(hp.type)} ${hp.power}`;
	}
}

function getEditedPoke() {
	var name = document.getElementById("edit-name").value.toLowerCase().replace(/ /g, "-");
	var item = document.getElementById("edit-item").value.toLowerCase().replace(/-/g, " ");
	var mvs = [];
	if (movesByName.has(document.getElementById("edit-move-1").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-1").value.toLowerCase().replace(/ /g, "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-2").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-2").value.toLowerCase().replace(/ /g, "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-3").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-3").value.toLowerCase().replace(/ /g, "-"))
	}
	if (movesByName.has(document.getElementById("edit-move-4").value.toLowerCase().replace(/ /g, "-"))) {
		mvs.push(document.getElementById("edit-move-4").value.toLowerCase().replace(/ /g, "-"))
	}
	if (isNaN(parseInt(document.getElementById("edit-lvl").value))) {
		return null;
	}
	if (pokemonByName.has(name)) {
		var poke = {
			name: name,
			item: item,
			level: parseInt(document.getElementById("edit-lvl").value),
			moves: mvs,
			dvs: {
				hp: parseInt(document.getElementById("edit-hp").value),
				atk: parseInt(document.getElementById("edit-atk").value),
				def: parseInt(document.getElementById("edit-def").value),
				spa: parseInt(document.getElementById("edit-spa").value),
				spd: parseInt(document.getElementById("edit-spd").value),
				spe: parseInt(document.getElementById("edit-spe").value),
			}
		};
		return poke;
	}
	return null;
}

function addEditedPoke() {
	var poke = getEditedPoke();
	if (poke) {
		box.push(poke);
		updateBox();
		clearEdits();
	}
	setTab("box");
}

function clearEdits() {
	var edits = document.getElementsByClassName("poke-edit-input");
	for (var i = 0; i < edits.length; i++) {
		if (edits[i].type == "number") {
			edits[i].value = "0";
		} else {
			edits[i].value = "";
		}
	}
	document.getElementById("edit-lvl").value = 5;
}

function calcFromBox(i) {
	theirPoke = box[i];
	updateCalc();
	setTab("calc");
}

function removeFromBox(i) {
	if (window.confirm("Delete from box?")) {
		box.splice(i, 1);
		updateBox();
	}
}

function moveToBoxStart(i) {
	if (i > 0) {
		var t = box[i];
		box.splice(i, 1);
		box.unshift(t);
		updateBox();
	}
}

function editBox(i, ret = "box") {
	clearEdits();
	editing = i;
	var poke = box[i];
	document.getElementById("edit-name").value = poke.name;
	document.getElementById("edit-item").value = poke.item;
	document.getElementById("edit-lvl").value = poke.level;
	for (var j = 0; j < poke.moves.length; j++) {
		document.getElementById("edit-move-" + (j + 1)).value = getMoveName(poke.moves[j]);
	}
	document.getElementById("edit-hp").value = getDv(poke, "hp");
	document.getElementById("edit-atk").value = getDv(poke, "atk");
	document.getElementById("edit-def").value = getDv(poke, "def");
	document.getElementById("edit-spa").value = getDv(poke, "spa");
	document.getElementById("edit-spd").value = getDv(poke, "spd");
	document.getElementById("edit-spe").value = getDv(poke, "spe");
	setTab("edit");
	editReturn = ret;
}

function editCalc() {
	for (var i = 0; i < box.length; i++) {
		if (myPoke === box[i]) {
			editBox(i, "calc");
		}
	}
}

function setPlayerItem(item) {
	myPoke.item = item;
	updateCalc();
	updateBox();
	for (var i = 0; i < box.length; i++) {
		if (myPoke === box[i]) {
			
		}
	}
}

function saveEdited() {
	var poke = getEditedPoke();
	if (poke) {
		var orig = box[editing];
		orig.name = poke.name;
		orig.item = poke.item;
		orig.level = poke.level;
		orig.moves = poke.moves;
		orig.dvs = poke.dvs;
		updateBox();
		setTab(editReturn);
	}
}