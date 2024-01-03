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
	applySettings();
}

function writeLocalStorage() {
	localStorage.setItem("calc/ck+", JSON.stringify(savedData));
}

function updateSettings() {
	settings.enableVsRecorder = document.getElementById("enable-vs-recorder").checked;
	applySettings();
}

function applySettings() {
	document.getElementById("enable-vs-recorder").checked = settings.enableVsRecorder == true;
	if (settings.enableVsRecorder) {
		document.getElementById("update-vs-recorder").style.display = "block";
	} else {
		document.getElementById("update-vs-recorder").style.display = "none";
	}
	savedData["settings"] = settings;
	writeLocalStorage();
}

document.getElementById("search-box").oninput = function (event) {
	var v = event.target.value;
	updateSearch(v);
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

var editInputs = document.getElementsByClassName("poke-edit-input");
for (let i in editInputs) {
	editInputs[i].oninput = function (event) {
		if (event.target.id.includes("edit-move")) {
			copyEditedMoves = false;
		}
		updateEdit();
	}
}

document.getElementById("badges").value = badges;

updateSearch(document.getElementById("search-box").value);

fetchData();
