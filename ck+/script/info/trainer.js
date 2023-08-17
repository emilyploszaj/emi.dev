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
	var v = "";
	for (var i = 0; i < data.trainers.length; i++) {
		var t = data.trainers[i];
		var meta = "";
		if (t.meta != undefined) {
			meta += t.meta;
		}
		if (isTrainerB2b(i) == false && isTrainerB2b(i + 1) == true) {
			v += `<div class="b2b">`;
		}
		if (meta) {
			v += "<h2>" + meta + "</h2>";
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
	t += '<button style="float:right;" onclick="statCheckTrainer(' + i + ')">Statistics</button>';
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

function getTrainerStats(i) {
	var trainer = data.trainers[i];
	var v = "<h3>" + getTrainerName(trainer.name) + '<button style="float:right;" onclick="calcTrainer(' + i + ')">Calc</button>' + "</h3>";
	v += '<div class="trainer">';
	v += '<div class="trainer-pokes">';
	v += getTeamDisplay(trainer);
	v += '</div>';
	v += '</div>';
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
					ht += '<div class="encounter-poke">';
					ht += '<img style="cursor:pointer;" onclick="focusPokeByName(\'' + p
						+ '\')" src="' + getPokeImage(p) + '">';
					ht += '</div>';
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
		v += '<div class="encounter-poke">';
		v += parseInt(e[1] * 100 / total) + "%";
		v += '<img style="cursor:pointer;" onclick="focusPokeByName(\'' + e[0]
			+ '\')" src="' + getPokeImage(e[0]) + '">';
		v += '</div>';
		ba++;
	}
	v += '</div>';
	return v;
}