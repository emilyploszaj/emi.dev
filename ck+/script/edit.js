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
	});
	updateBox();
	editing = box.length - 1;
	initEdit(box[box.length - 1]);
}

function initEdit(poke) {
	editOriginal = JSON.parse(JSON.stringify(poke));
	document.getElementById("edit-name").value = fullCapitalize(poke.name);
	document.getElementById("edit-item").value = fullCapitalize(poke.item);
	document.getElementById("edit-lvl").value = poke.level;
	OptionSelect.updateSelector(document.getElementById("edit-name"));
	OptionSelect.updateSelector(document.getElementById("edit-item"));
	for (var i = 0; i < 4; i++) {
		var el = document.getElementById("edit-move-" + (i + 1));
		if (i < poke.moves.length) {
			el.value = fullCapitalize(poke.moves[i]);
		} else {
			el.value = "";
		}
		OptionSelect.updateSelector(el);
	}
	for (const stat of STATS) {
		if (poke.dvs !== undefined && poke.dvs[stat] !== undefined) {
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
	Object.assign(orig, poke);
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

class DragDrop {
	static container = null;
	static type = "";
	static target = null;
	static status = -1;
	static location = {};

	static getDropInfo(cx, cy) {
		var scrollY = document.documentElement.scrollTop;
		var bestDistance = 9999999;
		var bestActualDistance;
		var bestLeft = false;
		var bestNearest = null;
		var bestPrevious = null;
		var previous = null;
		for (const s of this.container.getElementsByClassName("drag-sortable")) {
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
			if (el.getAttribute("drop-accept") == this.type) {
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

	static handlers() {
		document.onmousedown = function(event) {
			DragDrop.target = null;
			var el = event.target.closest(".drag-sortable");
			DragDrop.status = -1;
			if (el) {
				DragDrop.status = 0;
				DragDrop.target = el;
				DragDrop.location = {
					x: event.pageX,
					y: event.pageY
				}
			}
		}

		document.onmousemove = function(event) {
			if (DragDrop.target != null && DragDrop.status == 0) {
				var distance = Math.sqrt(Math.pow(DragDrop.location.x - event.pageX, 2) + Math.pow(DragDrop.location.y - event.pageY, 2));
				if (distance > 32) {
					DragDrop.container = DragDrop.target.closest(".drag-sort-container");
					DragDrop.type = orElse(DragDrop.container.getAttribute("drag-type"), "");
					document.getElementById("dragged").style.visibility = "visible";
					document.getElementById("dragged").innerHTML = DragDrop.target.outerHTML;
					DragDrop.status = 1;
				}
			}
			if (DragDrop.status == 1) {
				var scrollY = document.documentElement.scrollTop;
				var el = document.getElementById("dragged");
				el.style.left = event.pageX - (el.offsetWidth / 2) + "px";
				el.style.top = event.pageY - (el.offsetHeight / 2) + "px";
				var dropInfo = DragDrop.getDropInfo(event.pageX, event.pageY);
				if (dropInfo) {
					var del = document.getElementById("drop-indicator");
					var rect = dropInfo.element.getBoundingClientRect();
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
			if (DragDrop.target != null && DragDrop.status == 1) {
				var start = -1, end = -1;
				{
					var dropInfo = DragDrop.getDropInfo(event.pageX, event.pageY);
					var index = 0;
					for (const s of DragDrop.container.getElementsByClassName("drag-sortable")) {
						if (s === DragDrop.target) {
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
						eval(DragDrop.container.getAttribute("drag-swap"));
					}
				}
			}
			DragDrop.target = null;
			DragDrop.status = -1;
			document.getElementById("dragged").innerHTML = "";
			document.getElementById("dragged").style.visibility = "hidden";
			document.getElementById("drop-indicator").style.visibility = "hidden";
		}

		document.onselectstart = function(event) {
			if (DragDrop.target != null) {
				event.preventDefault();
				return false;
			}
		}
	}
}
DragDrop.handlers();

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

function suggestEditPokemon() {
	var getEvoExtra = function(p) {
		for (const v of data.pokemon) {
			if (!v.evolutions) {
				continue;
			}
			for (const evolution of v.evolutions) {
				if (evolution.into != p.name) {
					continue;
				}
				var text = "";
				if (evolution.method == "item") {
					text = fullCapitalize(evolution.item);
				} else if (evolution.method == "level") {
					text = `Lv${evolution.level}`;
				} else if (evolution.method == "hitmonlee" || evolution.method == "hitmonchan" || evolution.method == "hitmontop") {
					text = `Lv25`;
				} else {
					break;
				}
				return `<div class="suggestion-level">${text}</div>`;
			}
		}
		return "";
	}
	var edited = getEditedPoke();
	var family = getFamily(pokemonByName.get(edited.name));
	return family.sort((a, b) => a.pokedex - b.pokedex).map(p => { return { value: p.name, extra: getEvoExtra(p) }; });
}

function suggestEditMoves() {
	var edited = getEditedPoke();
	var p = pokemonByName.get(edited.name);
	var learnset = p.learnset.filter(l => l.level <= edited.level).filter(l => edited.moves.indexOf(l.move) == -1);
	if (learnset.length > 4) {
		learnset = learnset.splice(learnset.length - 4, 4);
	}
	return learnset.map(l => { return { value: l.move, extra: `<div class="suggestion-level">Lv${l.level}</div>` }; });
}

function suggestEditItems() {
	return [];
}

class OptionSelect {
	static lastClickInside = false;
	static target = null;
	static highlighted = -1;

	static updateSelector(element) {
		if (!element.value) {
			// Sizing gets weird unless there's a zws...
			element.innerHTML = `<div>​</div>`;
			return;
		}
		var value = normalize(element.value);
		var optionType = element.getAttribute("options");
		var contents = "";
		if (optionType == "moves") {
			contents = this.getOptionMove(movesByName.get(value), false);
		} else if (optionType == "pokemon") {
			contents = this.getOptionPokemon(pokemonByName.get(value), false);
		} else if (optionType == "items") {
			contents = this.getOptionItem(itemsByName.get(value), false);
		}
		element.innerHTML = contents;
	}

	static init(element) {
		this.target = element;
		this.highlighted = -1;
		var optionType = element.getAttribute("options");
		var suggested = element.getAttribute("suggested");
		if (suggested) {
			suggested = eval(suggested);
		} else {
			suggested = [];
		}
		var contents = "";
		if (optionType == "moves") {
			contents = data.moves.sort((a, b) => a.name.localeCompare(b.name)).displayMap(m => this.getOptionMove(m, true));
			suggested = suggested.displayMap(m => this.getOptionMove(movesByName.get(m.value), true, orElse(m.extra, "")));
		} else if (optionType == "pokemon") {
			contents = data.pokemon.sort((a, b) => a.name.localeCompare(b.name)).displayMap(p => this.getOptionPokemon(p, true));
			suggested = suggested.displayMap(p => this.getOptionPokemon(pokemonByName.get(p.value), true, orElse(p.extra, "")));
		} else if (optionType == "items") {
			contents = data.items.sort((a, b) => a.name.localeCompare(b.name)).displayMap(i => this.getOptionItem(i, true));
			suggested = suggested.displayMap(i => this.getOptionItem(itemsByName.get(i.value), true, orElse(i.extra, "")));
		}
		document.getElementById("suggested-option-list").innerHTML = suggested;
		document.getElementById("option-list").innerHTML = contents;
		var search = document.getElementById("option-search");
		search.value = "";
		this.update();
		search.focus();
	}

	static getOptionMove(move, option, extra = "") {
		if (!move) {
			return `<div>​</div>`;
		}
		return `<div${option ? ` class="option-list-option" search="${move.name}"` : ""}>${fullCapitalize(move.name)}${extra}</div>`;
	}

	static getOptionPokemon(poke, option, extra = "") {
		if (!poke) {
			return `<div>​</div>`;
		}
		return `<div${option ? ` class="option-list-option" search="${poke.name}"` : ""}>${fullCapitalize(poke.name)}${extra}</div>`;
	}

	static getOptionItem(item, option, extra = "") {
		if (!item) {
			return `<div>​</div>`;
		}
		return `<div${option ? ` class="option-list-option" search="${item.name}"` : ""}>${itemImage(item)}${fullCapitalize(item.name)}${extra}</div>`;
	}

	static cancel() {
		if (this.target == null) {
			return;
		}
		this.target = null;
		var options = document.getElementById("option-select");
		options.style.display = "none";
		document.getElementById("option-list").innerHTML = "";
	}

	static select(option) {
		if (option == null) {
			this.target.value = "";
		} else {
			if (typeof option == "number") {
				option = this.getOption(option);
			}
			this.target.value = option.getAttribute("search");
		}
		this.updateSelector(this.target);
		if (this.target.getAttribute("update")) {
			eval(this.target.getAttribute("update"));
		}
		this.target.focus();
		this.cancel();
	}

	static genericKey(event, text, highlighted, optionCount, select, highlight, allowEmpty) {
		if (event.key == "ArrowDown") {
			highlighted++;
			if (highlighted >= optionCount) {
				highlighted = -1;
			}
		} else if (event.key == "ArrowUp") {
			highlighted--;
			if (highlighted <= -2) {
				highlighted = optionCount - 1;
			}
		} else if (event.key == "ArrowLeft" || event.key == "ArrowRight") {
			if (highlighted == -1) {
				return;
			}
			select(highlighted);
		} else if (event.key == "Enter") {
			var selected = highlighted;
			if (selected <= -1) {
				if (text == "") {
					if (allowEmpty) {
						select(null);
						event.preventDefault();
					}
					return;
				}
				selected = 0;
			}
			if (selected >= optionCount) {
				return;
			}
			select(selected);
		} else {
			highlight(-1);
			return;
		}
		highlight(highlighted);
		event.preventDefault();
	}

	static key(event) {
		this.genericKey(event, document.getElementById("option-search").value, this.highlighted, this.getOptionCount(), s => this.select(s), h => {
			OptionSelect.highlighted = h;
			OptionSelect.update();
		}, this.target.getAttribute("empty-option"));
	}

	static getOptionCount() {
		var list = document.getElementById("option-list");
		var i = 0;
		for (const child of list.children) {
			if (child.style.display == "block") {
				i++;
			}
		}
		return i;
	}

	static getOption(option) {
		var list = document.getElementById("option-list");
		var i = 0;
		if (document.getElementById("option-search").value.toLowerCase().length == 0) {
			for (const child of document.getElementById("suggested-option-list").children) {
				if (i++ == option) {
					return child;
				}
			}
		}
		for (const child of list.children) {
			if (child.style.display == "block" && i++ == option) {
				return child;
			}
		}
		return null;
	}

	static update() {
		if (this.target == null) {
			return;
		}
		var text = normalize(document.getElementById("option-search").value);
		var list = document.getElementById("option-list");
		for (const child of list.children) {
			if (child.getAttribute("search").indexOf(text) != -1) {
				child.style.display = "block";
			} else {
				child.style.display = "none";
			}
		}
		for (const highlighted of document.getElementsByClassName("option-list-selected")) {
			highlighted.classList.remove("option-list-selected");
		}
		var highlightedOption = this.getOption(this.highlighted);
		if (highlightedOption) {
			highlightedOption.classList.add("option-list-selected");
			highlightedOption.scrollIntoView({block: "nearest"});
		}
		var suggested = document.getElementById("suggested-option-list");
		if (text.length > 0 || suggested.innerHTML.length == 0) {
			suggested.style.display = "none";
		} else {
			suggested.style.display = "block";
		}
		this.position();
	}

	static position() {
		if (this.target == null) {
			return;
		}
		var options = document.getElementById("option-select");
		var targetRect = this.target.getBoundingClientRect();
		var scrollY = document.documentElement.scrollTop;
		options.style.display = "flex";
		options.style.left = targetRect.left + "px";
		if (targetRect.bottom + 300 > window.innerHeight) {
			options.style.top = targetRect.bottom - options.clientHeight - 8 + scrollY + "px";
		} else {
			options.style.top = targetRect.top + scrollY + "px";
		}
	}

	static handlers() {
		document.addEventListener("keydown", (event) => {
			if (event.target.id == "option-search") {
				OptionSelect.key(event);
			}
		});

		document.addEventListener("input", (event) => {
			if (event.target.id == "option-search") {
				OptionSelect.update();
			}
		});

		document.addEventListener("mousedown", (event) => {
			if (event.target.closest(".option-selector")) {
				this.lastClickInside = true;
				OptionSelect.init(event.target.closest(".option-selector"));
			} else {
				this.lastClickInside = false;
			}
		});

		document.addEventListener("click", (event) => {
			if (!event.target.closest("#option-select")) {
				if (!this.lastClickInside || !doesElementContain(document.getElementById("option-select"), event.clientX, event.clientY)) {
					OptionSelect.cancel();
				} else {
					var selected = document.querySelector(".option-list-option:hover");
					if (selected) {
						OptionSelect.select(selected);
					} else {
						document.getElementById("option-search").focus();
						document.getElementById("option-search").click();
					}
				}
			}
			if (event.target.closest(".option-list-option")) {
				event.preventDefault();
				OptionSelect.select(event.target.closest(".option-list-option"));
			} else if (event.target.closest(".option-selector")) {
				event.preventDefault();
				OptionSelect.init(event.target.closest(".option-selector"));
			}
		});

		document.addEventListener("focus", (event) => {
			if (event.target && event.target.classList && event.target.classList.contains("option-selector") && OptionSelect.target != null) {
				event.preventDefault();
				document.getElementById("option-search").focus();
			}
		});
	}
}
OptionSelect.handlers();

class SearchBox {
	static highlighted = -1;

	static clearSearch() {
		document.getElementById("search-box").value = "";
		SearchBox.update();
	}

	static select(option) {
		if (typeof option == "number") {
			document.getElementsByClassName("search-suggestion")[option].click();
		} else {
			s.click();
		}
	}

	static getOptionCount() {
		return document.getElementsByClassName("search-suggestion").length;
	}

	static updateHighlight() {
		for (const el of document.getElementsByClassName("search-suggestion-highlighted")) {
			el.classList.remove("search-suggestion-highlighted");
		}
		var options = document.getElementsByClassName("search-suggestion");
		if (this.highlighted >= 0 && this.highlighted < options.length) {
			var el = options[this.highlighted];
			el.classList.add("search-suggestion-highlighted");
			el.scrollIntoView({block: "nearest"});
		}
	}

	static update() {
		var v = normalize(document.getElementById("search-box").value);
		var res = "";
		var i = 0;
		if (v.length > 0) {
			for (const n of searchResults.entries()) {
				if (n[0].includes(v)) {
					var content = n[1].display ? n[1].display() : fullCapitalize(n[0]);
					res += createLink(n[1].link, `<div class="search-suggestion ${i == this.highlighted ? `search-suggestion-highlighted` : ""}" onclick="SearchBox.clearSearch()">${content}</div>`);
					i++;
				}
			}
		}
		document.getElementById("search-suggestions").innerHTML = res;
	}

	static key(event) {
		OptionSelect.genericKey(event, document.getElementById("search-box").value, this.highlighted, this.getOptionCount(), s => this.select(s), h => {
			SearchBox.highlighted = h;
			SearchBox.updateHighlight();
		}, false);
	}

	static handlers() {
		document.addEventListener("keydown", (event) => {
			if (event.target.id == "search-box") {
				SearchBox.key(event);
			}
		});

		document.addEventListener("input", (event) => {
			if (event.target.id == "search-box") {
				SearchBox.update();
			}
		});
	}
}
SearchBox.handlers();
