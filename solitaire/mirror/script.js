const CARD_WIDTH = 92;
var dealing = true;
var easy = false;
var won = false;
var lastTouch = {};
var dragCard;
var dragLoc;
var movingCard;
var playSlots = [[], [], [], [], [], [], []];

document.ondragstart = function(e) {
}
document.onmousedown = function(e) {
	if (e.button != 0) {
		return false;
	}
	pressEvent(e);
}

document.onmousemove = function(e) {
	moveEvent(e);
}

document.onmouseup = function(e) {
	liftEvent(e);
}

document.ontouchstart = function(e) {
	e.clientX = e.targetTouches[0].clientX;
	e.clientY = e.targetTouches[0].clientY;
	lastTouch.x = e.clientX;
	lastTouch.y = e.clientY;
	pressEvent(e);
}

document.ontouchmove = function(e) {
	e.clientX = e.targetTouches[0].clientX;
	e.clientY = e.targetTouches[0].clientY;
	lastTouch.x = e.clientX;
	lastTouch.y = e.clientY;
	moveEvent(e);
}

document.ontouchend = function(e) {
	e.clientX = lastTouch.x;
	e.clientY = lastTouch.y;
	liftEvent(e);
}

function pressEvent(e) {
	var slot = SlotLoc.of(e.target.closest("slot").id);
	var mirroredSlot = slot.mirror();
	if (e.target.closest("card").getAttribute("draggable-card") != "true") {
		return;
	}
	var card = parseInt(e.target.closest("card").getAttribute("depth"));
	dragLoc = new CardLoc(slot, card);
	dragCard = {
		xOff: e.clientX - e.target.closest("card").getBoundingClientRect().left,
		yOff: e.clientY - e.target.closest("card").getBoundingClientRect().top
	};
	if (slot.type == "free") {
		dragCard = {
			xOff: 52,
			yOff: 102
		};
	}
	e.target.closest("card").style.display = "none";
	document.getElementById(`${mirroredSlot.type}-${mirroredSlot.index}`).querySelector(`card[depth="${card}"]`).style.display = "none";
	document.getElementById("dragged").innerHTML = getStackDisplay(false, dragLoc.getStack());
	document.getElementById("dragged").style.left = e.clientX - dragCard.xOff + "px";
	document.getElementById("dragged").style.top = e.clientY - dragCard.yOff + "px";
	document.getElementById("dragged").style.visibility = "visible";
	var sw = window.innerWidth;
	var mx = sw - (e.clientX - dragCard.xOff) - CARD_WIDTH;
	document.getElementById("dragged-mirrored").innerHTML = getStackDisplay(false, dragLoc.getStack().map(e => e.mirror));
	document.getElementById("dragged-mirrored").style.left = mx + "px";
	document.getElementById("dragged-mirrored").style.top = e.clientY - dragCard.yOff + "px";
	document.getElementById("dragged-mirrored").style.visibility = "visible";
}

function moveEvent(e) {
	if (dragCard) {
		var cx = e.clientX - dragCard.xOff;
		var cy = e.clientY - dragCard.yOff;
		cx = Math.max(4, cx);
		cx = Math.min(document.documentElement.scrollWidth - 116, cx);
		cy = Math.max(4, cy);
		if (dragLoc.slot.type == "play") {
			cx = Math.min(window.innerWidth / 2 - CARD_WIDTH - 2, cx);
		} else {
			cx = Math.max(window.innerWidth / 2 + 2, cx);
		}
		document.getElementById("dragged").style.left = cx + "px";
		document.getElementById("dragged").style.top = cy + "px";
		var sw = window.innerWidth;
		var mx = sw - cx - CARD_WIDTH;
		document.getElementById("dragged-mirrored").style.left = mx + "px";
	document.getElementById("dragged-mirrored").style.top = e.clientY - dragCard.yOff + "px";
	}
}

function liftEvent(e) {
	if (dragCard) {
		document.getElementById("dragged").style.visibility = "hidden";
		document.getElementById("dragged-mirrored").style.visibility = "hidden";
		var cx = e.clientX - dragCard.xOff + 52;
		var cy = e.clientY - dragCard.yOff + 102;
		try {
			dropCard(cx, cy);
		} catch (e) {
			console.log(e);
		}
		dragCard = undefined;
		refreshDisplay();
		checkAutomove();
	}
}

function dropCard(cx, cy) {
	var els = document.elementsFromPoint(cx, cy);
	var destLoc = undefined;
	for (let el of els) {
		if (el.closest("#dragged")) {
			continue;
		} else if (el.closest("slot")) {
			destLoc = SlotLoc.of(el.closest("slot").id);
			break;
		}
	}
	if (destLoc) {
		testLocs = [destLoc];
		for (let newLoc of testLocs) {
			if (newLoc.type == dragLoc.slot.type && newLoc.index == dragLoc.slot.index) {
				continue;
			}
			if (newLoc.canPlace(dragLoc.getStack())) {
				newLoc.place(dragLoc.getStack());
				dragLoc.clear();
				break;
			}
		}
	}
}

function prng(n) {
	// splitmix32 moment
	n |= 0;
	n = (n + 0x9e3779b9) | 0;
	var t = n ^ (n >>> 16);
	t = Math.imul(t, 0x21f0aaad);
	t = t ^ (t >>> 15);
	t = Math.imul(t, 0x735a2d97);
	return ((t = t ^ t >>> 15) >>> 0);
}

function shuffle(arr) {
	const params = new URLSearchParams(window.location.search);
	easy = params.has("easy") && params.get("easy") === "true";
	var seed;
	if (params.has("seed")) {
		seed = parseInt(params.get("seed"));
	} else {
		seed = Math.floor(Math.random() * 10000);
	}
	document.getElementById("seed").innerHTML = "" + seed;
	var i = arr.length;
	while (i > 0) {
		seed = prng(seed);
		var r = Math.floor(seed % i--);
		var s = arr[r];
		arr[r] = arr[i];
		arr[i] = s;
	}
	return arr;
}

function generateDeck() {
	var deck = [];
	for (var i = 1; i < 15; i++) {
		deck.push({suit: "composition", id: i});
		deck.push({suit: "narrative", id: i});
		deck.push({suit: "performance", id: i});
	}
	var starSuits = ["cerulean", "viridian", "rose", "lilac", "ash", "chartreuse", "turquoise"];
	deck = shuffle(deck);
	for (var i = 0; i < 7; i++) {
		for (var j = 1; j < 7; j++) {
			var index = i * 6 + j - 1;
			deck[index].mirror = {suit: starSuits[i], id: j};
		}
	}
	return shuffle(deck);
}

function dealDeck() {
	var deck = generateDeck();
	var i = 0;
	var interval = setInterval(function() {
		if (deck.length == 0) {
			clearInterval(interval);
			dealing = false;
		} else if (!movingCard) {
			var rect = document.getElementById("play-3").getBoundingClientRect();
			movingCard = {
				slot: new SlotLoc("play", i),
				card: deck.pop(),
				x: rect.left,
				y: rect.top
			}
			i++;
			if (i == 3) {
				i++;
			}
			if (i >= 7) {
				i = 0;
			}
		}
	}, 10);
}

function getStackDisplay(removable, cards) {
	var v = "";
	var ending = "";
	for (var i = 0; i < cards.length; i++) {
		var c = cards[i];
		var draggable = removable && areStacked(cards.slice(i));
		var face = "";
		var style = "";
		if (c.z && i + 1 == cards.length) {
			style = "z-index:" + c.z;
		}
		face = `<img src="./${suitType(c)}-${c.suit}.svg">`
		v += `<card style="${style}" suit="${c.suit}" depth=${i} draggable-card=${draggable}><card-header>${getName(c)}</card-header><face>${face}</face><card-footer>${getName(c)}</card-footer>`;
		ending += "</card>";
	}
	v += ending;
	return v;
}

function getName(c) {
	var num = c.id;
	return num;
}

function automove(slot, dest) {
	var rect = document.getElementById(slot.type + "-" + slot.index).getElementsByTagName("card")[slot.getStack().length - 1].getBoundingClientRect();
	movingCard = {
		slot: dest,
		card: slot.getStack().pop(),
		x: rect.left,
		y: rect.top
	}
	refreshDisplay();
}

function checkWin() {
	if (won) {
		return;
	}
	for (var i = 0; i < 7; i++) {
		if (playSlots[i].length != 6) {
			return;
		}
		for (var j = 1; j < 6; j++) {
			if (playSlots[i][j].mirror.suit != playSlots[i][j - 1].mirror.suit) {
				return;
			}
			if (Math.abs(playSlots[i][j].mirror.id - playSlots[i][j - 1].mirror.id) != 1) {
				return;
			}
		}
	}
	won = true;
	var wins = parseInt(localStorage.getItem("solitaire/mirror/wins") ?? "0") + 1;
	localStorage.setItem("solitaire/mirror/wins", wins);
	updateWins();
}

function checkAutomove() {
	checkWin();
	return; // No automove :)
}

function refreshDisplay() {
	for (var i = 0; i < playSlots.length; i++) {
		document.getElementById("play-" + i).innerHTML = getStackDisplay(true, playSlots[i]);
		document.getElementById("mirroredplay-" + i).innerHTML = getStackDisplay(true, playSlots[i].map(a => a.mirror));
	}
}

function areStacked(cards) {
	for (var i = 1; i < cards.length; i++) {
		if (!canStackOn(cards[i], cards[i - 1])) {
			return false;
		}
	}
	return true;
}

function suitType(card) {
	if (card.suit == "composition" || card.suit == "narrative" || card.suit == "performance") {
		return "art";
	} else {
		return "dream";
	}
}

function canStackOn(card, base) {
	if (suitType(card) != suitType(base)) {
		return false;
	}
	if (suitType(card) == "art") {
		return card.suit != base.suit && base.id == card.id + 1;
	} else {
		return card.suit == base.suit && Math.abs(card.id - base.id) == 1;
	}
}

setInterval(function() {
	if (movingCard) {
		var dest = movingCard.slot;
		var rect = document.getElementById(dest.type + "-" + dest.index).getBoundingClientRect();
		if (dest.type == "play" || dest.type == "mirroredplay") {
			var cardEls = document.getElementById(dest.type + "-" + dest.index).getElementsByTagName("card");
			if (cardEls.length > 0) {
				rect = cardEls[cardEls.length - 1].getBoundingClientRect();
			}
		}
		var dx = rect.left;
		var dy = rect.top;
		if (dest.type == "play" || dest.type == "mirroredplay") {
			var cardEls = document.getElementById(dest.type + "-" + dest.index).getElementsByTagName("card");
			if (cardEls.length > 0) {
				dy += 40;
			}
		}
		var sx = movingCard.x;
		var sy = movingCard.y;
		var distance = Math.sqrt(Math.pow(dx - sx, 2) + Math.pow(dy - sy, 2));
		var angle = Math.atan2(dx - sx, dy - sy);
		if (distance <= 40) {
			dest.place([movingCard.card]);
			movingCard = null;
			refreshDisplay();
			document.getElementById("moving-card").style.visibility = "hidden";
			document.getElementById("mirrored-moving-card").style.visibility = "hidden";
			checkAutomove();
		} else {
			movingCard.x = sx + Math.sin(angle) * 40;
			movingCard.y = sy + Math.cos(angle) * 40;
			document.getElementById("moving-card").innerHTML = getStackDisplay(false, [movingCard.card]);
			document.getElementById("moving-card").style.visibility = "visible";
			document.getElementById("moving-card").style.left = movingCard.x + "px";
			document.getElementById("moving-card").style.top = movingCard.y + "px";

			document.getElementById("mirrored-moving-card").innerHTML = getStackDisplay(false, [movingCard.card.mirror]);
			document.getElementById("mirrored-moving-card").style.visibility = "visible";
			document.getElementById("mirrored-moving-card").style.left = window.innerWidth - movingCard.x - CARD_WIDTH + "px";
			document.getElementById("mirrored-moving-card").style.top = movingCard.y + "px";
		}
	}
}, 10);

function mirrorCards(cards) {
	var out = [];
	for (const card of cards) {
		out.push({suit: card.mirror.suit, id: card.mirror.id, mirror: {suit: card.suit, id: card.id}});
	}
	return out;
}

function updateWins() {
	document.getElementById("wins").innerHTML = "Wins: " + (localStorage.getItem("solitaire/mirror/wins") ?? "0");
}

function toggleInstructions() {
	document.getElementById("instruction-0").innerHTML = getStackDisplay(false, [
		{suit: "composition", id: 11}, {suit: "narrative", id: 10}, {suit: "composition", id: 9}
	]);
	document.getElementById("instruction-1").innerHTML = getStackDisplay(false, [
		{suit: "performance", id: 8}, {suit: "composition", id: 7}, {suit: "narrative", id: 6}, {suit: "performance", id: 5}, {suit: "narrative", id: 4}, {suit: "composition", id: 3}
	]);
	document.getElementById("instruction-2").innerHTML = getStackDisplay(false, [
		{suit: "performance", id: 4}, {suit: "narrative", id: 3}, {suit: "performance", id: 2}, {suit: "narrative", id: 1}
	]);
	document.getElementById("instruction-3").innerHTML = getStackDisplay(false, [
		{suit: "cerulean", id: 6}, {suit: "cerulean", id: 5}, {suit: "cerulean", id: 4}, {suit: "cerulean", id: 3}
	]);
	document.getElementById("instruction-4").innerHTML = getStackDisplay(false, [
		{suit: "viridian", id: 1}, {suit: "viridian", id: 2}, {suit: "viridian", id: 3}, {suit: "viridian", id: 4}, {suit: "viridian", id: 5}, {suit: "viridian", id: 6}
	]);
	document.getElementById("instruction-5").innerHTML = getStackDisplay(false, [
		{suit: "rose", id: 3}, {suit: "rose", id: 4}, {suit: "rose", id: 5}
	]);
	var el = document.getElementById("instruction-overlay");
	if (el.style.display == "none") {
		el.style.display = "block";
	} else {
		el.style.display = "none";
	}
}

class CardLoc {
	constructor(slot, card) {
		this.slot = slot;
		this.card = card;
	}

	getStack() {
		return this.slot.getStack().slice(this.card);
	}

	clear() {
		var s = this.slot;
		if (this.slot.type == "mirroredplay") {
			s = this.slot.mirror();
		}
		while (s.getStack().length > this.card) {
			s.getStack().pop();
		}
	}
}

class SlotLoc {
	constructor(type, index) {
		this.type = type;
		this.index = index;
	}

	static of(id) {
		var parts = id.split("-");
		return new SlotLoc(parts[0], parseInt(parts[1]));
	}

	canPlace(cards) {
		return this.isEmpty() || canStackOn(cards[0], this.getTopCard());
	}

	place(cards) {
		if (this.type == "play") {
			playSlots[this.index].push(...cards);
		} else {
			playSlots[this.index].push(...mirrorCards(cards));
		}
	}

	isEmpty() {
		return this.getStack().length == 0;
	}

	getStack() {
		if (this.type == "play") {
			return playSlots[this.index];
		} else if (this.type == "mirroredplay") {
			return mirrorCards(playSlots[this.index]);
		}
	}

	getTopCard() {
		var stack = this.getStack();
		return stack[stack.length - 1];
	}

	mirror() {
		if (this.type == "play") {
			return new SlotLoc("mirroredplay", this.index);
		} else {
			return new SlotLoc("play", this.index);
		}
	}
}

updateWins();
dealDeck();
refreshDisplay();
