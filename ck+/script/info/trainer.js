function calculateBrings(fights) {
	var brings = new Map();
	var leads = new Map();
	for (const f of fights.reverse()) {
		var pokes = f.pokemon;
		if (pokes.length > 0) {
			if (!leads.has(pokes[0])) {
				leads.set(pokes[0], 0);
			}
			leads.set(pokes[0], leads.get(pokes[0]) + 1);
			for (const p of pokes) {
				if (!brings.has(p)) {
					brings.set(p, 0);
				}
				brings.set(p, brings.get(p) + 1);
			}
		}
	}
	brings = new Map([...brings.entries()].sort((a, b) => b[1] - a[1]));
	leads = new Map([...leads.entries()].sort((a, b) => b[1] - a[1]));
	return {
		"brings": brings,
		"leads": leads,
		"total": fights.length
	};
}

function displayTrainers() {
	var lastArea = ""
	var v = "";
	for (var i = 0; i < data.trainers.length; i++) {
		var t = data.trainers[i];
		if (isTrainerB2b(i) == false && isTrainerB2b(i + 1) == true) {
			v += `<div class="b2b">`;
		}
		if (t.area != undefined && t.area != lastArea) {
			lastArea = t.area
			var areaName = lastArea;
			if (lastArea.includes("-")) {
				areaName = fullCapitalize(areaName);
			}
			v += "<h2>" + areaName + "</h2>";
		}
		if (t.meta != undefined) {
			v += "<h3>" + t.meta + "</h3>";
		}
		v += getTrainerDisplay(t, i);
		if (isTrainerB2b(i) == true && isTrainerB2b(i + 1) == false) {
			v += `</div>`;
		}
	}
	document.getElementById("trainers").innerHTML = v;
}

function getTrainerDisplay(trainer, i) {
	var t = "";
	t += '<div class="trainer">'
	t += '<div>' + getTrainerName(trainer.name);
	t += '<button style="float:right;" onclick="calcTrainer(' + i + ')">Calc</button>';
	t += createLink(`#/trainer/${trainer.name}/`, '<button style="float:right;">Info</button>');
	t += '</div>';
	t += '<div class="trainer-pokes">';
	t += getTeamDisplay(trainer);
	t += '</div>';
	t += '</div>';
	return t;
}

function getTeamDisplay(t) {
	var v = "";
	for (var i = 0; i < t.team.length; i++) {
		v += getTinyPokemonDisplay(t.team[i]);
	}
	return v;
}

function getTrainerStats(trainer) {
	var i = parseInt(trainer.index);
	var previous = orElse(data.trainers[i - 1], {"name": trainer.name}).name;
	var next = orElse(data.trainers[i + 1], {"name": trainer.name}).name;
	var v = `
		<h3>
			${getTrainerName(trainer.name)}
			<span style = "float:right;">
			<button onclick="calcTrainer(${i})">Calc</button>
			${createLink(`#/trainer/${previous}/`, `<button>Previous</button>`)}
			${createLink(`#/trainer/${next}/`, `<button>Next</button>`)}
			</span>
		</h3>
	`;
	v += '<div class="trainer">';
	v += '<div class="trainer-pokes">';
	v += getTeamDisplay(trainer);
	v += '</div>';
	v += '</div>';
	v += `<div class="engine-flag-statistics">`;
	var fights = fightsByTrainer.get(trainer.name.toLowerCase());
	if (fights) {
		var ht = "";
		ht += '<p>Historic teams:</p>';
		for (const f of fights.reverse()) {
			var pokes = f.pokemon;
			if (pokes.length > 0) {
				ht += '<div>' + f.runner + " (Patch: " + f.patch + ")</div>";
				ht += '<div class="learnset-pool">'
				for (const p of pokes) {
					ht += getEncounterPoke(p);
				}
				ht += '</div>';
			}
		}
		var b = calculateBrings(fights);
		v += '<p>Common Leads:</p>';
		v += getBringsDisplay(b.leads, fights.length, 7);
		v += '<p>Common Pokemon:</p>';
		v += getBringsDisplay(b.brings, fights.length, 21);
		v += ht;
	}
	v += `</div>`;
	return v;
}

function getBringsDisplay(brings, total, maxShown) {
	v = "";
	v += '<div class="learnset-pool">'
	var ba = 0;
	for (const e of brings.entries()) {
		if (ba >= maxShown) {
			break;
		}
		v += getEncounterPoke(e[0], parseInt(e[1] * 100 / total) + "%");
		ba++;
	}
	v += '</div>';
	return v;
}