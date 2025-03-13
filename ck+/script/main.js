var savedData = {};
var settings = {};

function readLocalStorage() {
	if (localStorage.getItem("calc/ck+")) {
		savedData = JSON.parse(localStorage.getItem("calc/ck+"));
	} else {
		if (localStorage.getItem("box")) {
			savedData["box"] = JSON.parse(localStorage.getItem("box"));
		}
		if (localStorage.getItem("dead-box")) {
			savedData["dead-box"] = JSON.parse(localStorage.getItem("dead-box"));
		}
		if (localStorage.getItem("badges")) {
			savedData["badges"] = parseInt(localStorage.getItem("badges"));
		}
		if (localStorage.getItem("settings")) {
			savedData["settings"] = JSON.parse(localStorage.getItem("settings"));
		}
	}
	savedData = orElse(savedData, {});
	box = orElse(savedData["box"], []);
	deadBox = orElse(savedData["dead-box"], []);
	badges = orElse(savedData["badges"], 0);
	settings = orElse(savedData["settings"], {});
	if (settings.enableStatistics == undefined) {
		settings.enableStatistics = true;
	}
	if (settings.extraDupes == undefined) {
		settings.enableStatistics = [];
	}
	applySettings();
}

function writeLocalStorage() {
	localStorage.setItem("calc/ck+", JSON.stringify(savedData));
}

function updateSettings() {
	settings.enableVsRecorder = document.getElementById("enable-vs-recorder").checked;
	settings.enableStatistics = document.getElementById("enable-statistics").checked;
	settings.extraDupes = getExtraDupes();
	applySettings();
}

function applySettings() {
	document.getElementById("enable-vs-recorder").checked = settings.enableVsRecorder == true;
	document.getElementById("enable-statistics").checked = settings.enableStatistics == true;
	if (settings.enableVsRecorder) {
		document.getElementById("update-vs-recorder").style.display = "block";
	} else {
		document.getElementById("update-vs-recorder").style.display = "none";
	}
	document.getElementById("extra-dupes").value = orElse(settings.extraDupes, []).join(" ");
	updateEngineFlags();
	savedData["settings"] = settings;
	writeLocalStorage();
}

function getExtraDupes() {
	return document.getElementById("extra-dupes").value.split(/[ ,\n\t]+/).map(e => normalize(e)).filter(e => pokemonByName.has(e));
}

function updateExtraDupes() {
	var dupes = getExtraDupes();
	var v = "";
	for (const dupe of dupes) {
		if (pokemonByName.has(dupe)) {
			v += `<div class="micro-mon drag-sortable">
				<img draggable="false" src="${getPokeImage(pokemonByName.get(dupe))}">
			</div>`;
		}
	}
	document.getElementById("extra-dupes-preview").innerHTML = v;
}

document.ondrop = function (event) {
	if (event.dataTransfer.files) {
		var file = event.dataTransfer.files[0];
		readFile(file);
	}
	event.preventDefault();
}

document.getElementById("sav-upload").onchange = function (event) {
	if (document.getElementById("sav-upload").files) {
		var file = document.getElementById("sav-upload").files[0];
		readFile(file);
	}
}

function clearData() {
	box = [];
	document.getElementById("badges").value = 0;
	updateBadges();
	updateBox();
}

document.ondragover = function (event) {
	event.preventDefault();
}

document.getElementById("badges").oninput = function (event) {
	updateBadges();
}

readLocalStorage();

setItemMenu();

document.getElementById("badges").value = badges;

SearchBox.update();

initGame();
