const STATS = ["hp", "atk", "def", "spa", "spd", "spe"];
var editOriginal;
var editingType;

function editPlayer() {
	openMenu("edit");
	editingType = "player";
	editing = -1;
	for (var i = 0; i < box.length; i++) {
		if (myPoke === box[i]) {
			editing = i;
		}
	}
	initEdit(myPoke);
}

function editEnemy() {
	openMenu("edit");
	editingType = "enemy";
	editing = -1;
	theirPoke = JSON.parse(JSON.stringify(theirPoke));
	initEdit(theirPoke);
}

function editBox(i) {
	openMenu("edit");
	editingType = "box";
	editing = i;
	initEdit(box[i]);
}

function addPokemonToBox() {
	openMenu("edit");
	box.push({
		name: "mew",
		level: 10,
		item: "",
		moves: [],
		dvs: {
			hp: 15,
			atk: 15,
			def: 15,
			spa: 15,
			spd: 15,
			spe: 15,
		}
	})
	updateBox();
	editing = box.length - 1;
	initEdit(box[box.length - 1]);
}

function initEdit(poke) {
	editOriginal = JSON.parse(JSON.stringify(poke));
	document.getElementById("edit-name").value = fullCapitalize(poke.name);
	document.getElementById("edit-item").value = fullCapitalize(poke.item);
	document.getElementById("edit-lvl").value = poke.level;
	for (var i = 0; i < 4; i++) {
		var el = document.getElementById("edit-move-" + (i + 1));
		if (i < poke.moves.length) {
			el.value = fullCapitalize(poke.moves[i]);
		} else {
			el.value = "";
		}
	}
	for (const stat of STATS) {
		if (poke.dvs && poke.dvs[stat]) {
			document.getElementById("edit-" + stat + "-dv").value = poke.dvs[stat];
		} else {
			document.getElementById("edit-" + stat + "-dv").value = 15;
		}
	}
	updateEdits();
}

function undoEdit() {
	initEdit(editOriginal);
	changeEdit();
}

function addEditCopy() {
	var poke = getEditedPoke();
	box.push(poke);
	undoEdit();
	editing = box.length - 1;
	setPlayer(box.length - 1);
	initEdit(box[box.length - 1]);
	updateBox();
	updateCalc();
}

function changeEdit() {
	updateEdits();
	saveEdited();
}

function saveEdited() {
	var poke = getEditedPoke();
	var orig;
	if (editingType == "player" || editingType == "box") {
		if (editing >= 0 && editing < box.length) {
			orig = box[editing];
		} else {
			orig = myPoke;
		}
	} else if (editingType == "enemy") {
		orig = theirPoke;
	}
	orig.name = poke.name;
	orig.item = poke.item;
	orig.level = poke.level;
	orig.moves = poke.moves;
	orig.dvs = poke.dvs;
	updateBox();
	updateCalc();
}

function updateEdits() {
	var validate = function(name, validator) {
		var el = document.getElementById(name);
		var v = normalize(el.value);
		if (validator(v)) {
			el.setAttribute("last-valid", v);
		}
	}
	validate("edit-name", v => pokemonByName.has(v));
	validate("edit-item", v => v == "" || itemsByName.has(v));
	validate("edit-lvl", v => v <= 100 && v > 0);
	validate("edit-move-1", v => v == "" || movesByName.has(v));
	validate("edit-move-2", v => v == "" || movesByName.has(v));
	validate("edit-move-3", v => v == "" || movesByName.has(v));
	validate("edit-move-4", v => v == "" || movesByName.has(v));
	for (const stat of STATS) {
		validate("edit-" + stat + "-dv", v => v >= 0 && v < 16);
		validate("edit-" + stat + "-ev", v => v >= 0 && v < 256);
	}
	var poke = getEditedPoke();
	var bp = BattlePoke.of(editingType != "enemy", poke, getEmptyStages());
	var hiddenPower = getHiddenPower(poke);
	for (const stat of STATS) {
		document.getElementById("edit-" + stat).innerHTML = bp.getEffectiveStat(stat);
	}
	document.getElementById("edit-hidden-power").innerHTML = fullCapitalize(hiddenPower.type) + " " + hiddenPower.power;
}

function getEditedPoke() {
	return {
		name: document.getElementById("edit-name").getAttribute("last-valid"),
		item: document.getElementById("edit-item").getAttribute("last-valid"),
		level: parseInt(document.getElementById("edit-lvl").getAttribute("last-valid")),
		moves: [
			document.getElementById("edit-move-1").getAttribute("last-valid"),
			document.getElementById("edit-move-2").getAttribute("last-valid"),
			document.getElementById("edit-move-3").getAttribute("last-valid"),
			document.getElementById("edit-move-4").getAttribute("last-valid")
		].filter(v => v && v.length > 0),
		dvs: {
			hp: parseInt(document.getElementById("edit-hp-dv").getAttribute("last-valid")),
			atk: parseInt(document.getElementById("edit-atk-dv").getAttribute("last-valid")),
			def: parseInt(document.getElementById("edit-def-dv").getAttribute("last-valid")),
			spa: parseInt(document.getElementById("edit-spa-dv").getAttribute("last-valid")),
			spd: parseInt(document.getElementById("edit-spd-dv").getAttribute("last-valid")),
			spe: parseInt(document.getElementById("edit-spe-dv").getAttribute("last-valid"))
		}
	};
}

function calcFromBox(i) {
	theirPoke = box[i];
	updateCalc();
	navigate("#/calc/");
	history.pushState(getLinkState(), "", "#/calc/");
}

function removeFromBox(i) {
	box.splice(i, 1);
	updateBox();
}

function moveToBoxStart(i) {
	if (i > 0) {
		var t = box[i];
		box.splice(i, 1);
		box.unshift(t);
		updateBox();
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

var dragContainer = null;
var dragType = "";
var dragTarget = null;
var dragStatus = -1;
var dragLocation = {};

document.onmousedown = function(event) {
	dragTarget = null;
	var el = event.target.closest(".drag-sortable");
	dragStatus = -1;
	if (el) {
		dragStatus = 0;
		dragTarget = el;
		dragLocation = {
			x: event.pageX,
			y: event.pageY
		}
	}
}

document.onmousemove = function(event) {
	if (dragTarget != null && dragStatus == 0) {
		var distance = Math.sqrt(Math.pow(dragLocation.x - event.pageX, 2) + Math.pow(dragLocation.y - event.pageY, 2));
		if (distance > 32) {
			dragContainer = dragTarget.closest(".drag-sort-container");
			dragType = orElse(dragContainer.getAttribute("drag-type"), "");
			document.getElementById("dragged").style.visibility = "visible";
			document.getElementById("dragged").innerHTML = dragTarget.outerHTML;
			dragStatus = 1;
		}
	}
	if (dragStatus == 1) {
		var scrollY = document.documentElement.scrollTop;
		var el = document.getElementById("dragged");
		el.style.left = event.pageX - (el.offsetWidth / 2) + "px";
		el.style.top = event.pageY - (el.offsetHeight / 2) + "px";
		var dropInfo = getDropInfo(event.pageX, event.pageY);
		if (dropInfo) {
			var del = document.getElementById("drop-indicator");
			rect = dropInfo.element.getBoundingClientRect();
			if (dropInfo.type == "external") {
				del.style.visibility = "visible";
				del.innerHTML = `<div class="drop-indicator-external" style="left:${rect.left}px;top:${rect.top + scrollY}px;width:${rect.width}px;height:${rect.height}px;"></div>`;
			} else if (dropInfo.distance < 100) {
				del.style.visibility = "visible";
				var left = dropInfo.side == "left" ? rect.left : rect.right;
				if (dropInfo.previousElement && dropInfo.side == "left") {
					var previousRect = dropInfo.previousElement.getBoundingClientRect();
					if (previousRect.y == rect.y) {
						left = previousRect.right;
					}
				}
				del.innerHTML = `<div class="drop-indicator-internal" style="left:${left}px;top:${rect.top + scrollY}px;width:4px;height:${rect.height}px;"></div>`;
			} else {
				del.style.visibility = "hidden";
			}
		}
	}
}

document.onmouseup = function(event) {
	if (dragTarget != null && dragStatus == 1) {
		var start = -1, end = -1;
		{
			var dropInfo = getDropInfo(event.pageX, event.pageY);
			var index = 0;
			for (const s of dragContainer.getElementsByClassName("drag-sortable")) {
				if (s === dragTarget) {
					start = index;
				} else if (s === dropInfo.element) {
					end = index + (dropInfo.side == "right" ? 1 : 0);
				}
				index++;
			}
		}
		if (dropInfo.type == "external") {
			if (start != -1) {
				var from = start;
				eval(dropInfo.element.getAttribute("drop"));
			}
		} else {
			if (dropInfo.distance < 100 && start != -1 && end != -1) {
				var from = start;
				var to = end;
				eval(dragContainer.getAttribute("drag-swap"));
			}
		}
	}
	dragTarget = null;
	dragStatus = -1;
	document.getElementById("dragged").style.visibility = "hidden";
	document.getElementById("drop-indicator").style.visibility = "hidden";
}

function getDropInfo(cx, cy) {
	var scrollY = document.documentElement.scrollTop;
	var bestDistance = 9999999;
	var bestActualDistance;
	var bestLeft = false;
	var bestNearest = null;
	var bestPrevious = null;
	var previous = null;
	for (const s of dragContainer.getElementsByClassName("drag-sortable")) {
		var rect = s.getBoundingClientRect();
		var sx = rect.x + (rect.width / 2);
		var sy = rect.y + (rect.height / 2) + scrollY;
		var distance = Math.abs(sy - cy) * 4096 + Math.abs(sx - cx);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestActualDistance = Math.sqrt(Math.pow(sx - cx, 2) + Math.pow(sy - cy, 2));
			bestNearest = s;
			bestLeft = cx < sx;
			bestPrevious = previous;
		}
		previous = s;
	}
	var dropAccept = null;
	for (const el of document.querySelectorAll(":hover")) {
		if (el.getAttribute("drop-accept") == dragType) {
			dropAccept = el;
		}
	}
	if (dropAccept) {
		return {
			type: "external",
			element: dropAccept
		};
	}
	if (bestNearest) {
		return {
			type: "internal",
			element: bestNearest,
			previousElement: bestPrevious,
			distance: bestActualDistance,
			side: bestLeft ? "left" : "right"
		};
	}
	return null;
}

document.onselectstart = function(event) {
	if (dragTarget != null) {
		event.preventDefault();
		return false;
	}
}

function swapBox(from, to) {
	var el = box[from];
	box.splice(from, 1);
	if (to > from) {
		to--;
	}
	box.splice(to, 0, el);
	updateBox();
	updateCalc();
}

function calcEnemyFromBox(from) {
	theirPoke = box[from];
	updateCalc();
}
