// I C L J S Z
const COLORS = ["#00FFFF", "#FF00FF", "#FFAA00", "#0000FF", "#00FF00", "#FF0000"];
const START_X = [3, 4, 3, 3, 3, 3];
const START_Y = [-2, -1, -2, -2, -2, -2];
const SHAPES = [
	[
		[[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]],
		[[0, 2], [1, 2], [1, 1], [2, 1], [2, 0]],
		[[1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
		[[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]],
		[[1, 4], [1, 3], [2, 3], [2, 2], [3, 2]],
		[[0, 2], [1, 2], [1, 3], [2, 3], [2, 4]]
	],
	[
		[[1, 2], [0, 2], [0, 1], [0, 0], [1, 0]],
		[[1, 1], [0, 2], [0, 1], [0, 0], [1, 0]],
		[[1, 1], [1, 2], [0, 1], [0, 0], [1, 0]],
		[[1, 1], [1, 2], [0, 2], [0, 0], [1, 0]],
		[[1, 1], [1, 2], [0, 2], [0, 1], [1, 0]],
		[[1, 1], [1, 2], [0, 2], [0, 1], [0, 0]]
	],
	[
		[[1, 0], [1, 1], [1, 2], [1, 3], [2, 3]],
		[[2, 0], [2, 1], [1, 1], [1, 2], [1, 3]],
		[[3, 2], [2, 2], [2, 1], [1, 1], [1, 2]],
		[[2, 4], [2, 3], [2, 2], [2, 1], [1, 1]],
		[[1, 4], [1, 3], [2, 3], [2, 2], [2, 1]],
		[[0, 2], [1, 2], [1, 3], [2, 3], [2, 2]]
	],
	[
		[[2, 0], [2, 1], [2, 2], [2, 3], [1, 3]],
		[[3, 2], [2, 2], [2, 3], [1, 3], [1, 2]],
		[[2, 4], [2, 3], [1, 3], [1, 2], [1, 1]],
		[[1, 4], [1, 3], [1, 2], [1, 1], [2, 1]],
		[[0, 2], [1, 2], [1, 1], [2, 1], [2, 2]],
		[[1, 0], [1, 1], [2, 1], [2, 2], [2, 3]]
	],
	[
		[[1, 2], [1, 3], [2, 2], [2, 3], [2, 4]],
		[[1, 1], [1, 2], [1, 3], [1, 4], [2, 3]],
		[[0, 2], [1, 1], [1, 2], [1, 3], [2, 1]],
		[[1, 0], [1, 1], [1, 2], [2, 1], [2, 2]],
		[[1, 1], [2, 0], [2, 1], [2, 2], [2, 3]],
		[[1, 3], [2, 1], [2, 2], [2, 3], [3, 2]]
	],
	[
		[[2, 2], [2, 3], [1, 2], [1, 3], [1, 4]],
		[[2, 3], [1, 1], [1, 2], [1, 3], [0, 2]],
		[[2, 1], [1, 0], [1, 1], [1, 2], [1, 3]],
		[[2, 0], [2, 1], [2, 2], [1, 1], [1, 2]],
		[[3, 2], [2, 1], [2, 2], [2, 3], [1, 1]],
		[[2, 1], [2, 2], [2, 3], [2, 4], [1, 3]]
	]
];
const KICKS = [
	[0, 0], [-1, 1], [1, 1], [0, 2], [0, -2], [-1, -1], [1, -1], [0, 4]
];

var initialDelay = 200;
var repeatDelay = 50;

var board;
var ctx;
var piece = {x: 0, y: 0, color: 0, rot: 0};
var shape;
var bag = [];

var timeout;
var keyTimeouts = [null, null, null, null, null, null];

function delayChange() {
	initialDelay = document.getElementById("initial").value;
	repeatDelay = document.getElementById("repeat").value;
	localStorage.setItem("initial", initialDelay)
	repeatDelay.setItem("repeat", repeatDelay);
}

function addBag() {
	var newPieces = [0, 1, 2, 3, 4, 5];
	while (newPieces.length > 0) {
		var i = uniform(newPieces.length);
		bag.push(newPieces[i]);
		newPieces.splice(i, 1);
	}
}

function newPiece() {
	piece = {x: 0, y: 0, color: bag.shift(), rot: 0};
	console.log(bag.length);
	if (bag.length < 3) {
		addBag();
	}
	piece.x = START_X[piece.color];
	piece.y = START_Y[piece.color];
	shape = SHAPES[piece.color][piece.rot];
	if (!movePiece(0, 0)) {
		clearBoard();
	}
}

function clearBoard() {
	board = Array(10);
	for (x = 0; x < 10; x++) {
		board[x] = Array(20);
		for (y = 0; y < 20; y++) {
			board[x][y] = -1;
		}
	}
	bag = [];
	addBag();
	newPiece();
}

document.onkeydown = function(event) {
	if (event.repeat) {
		return;
	}
	var key = event.keyCode;
	if (key == 38) {
		rotClockwise();
		keyTimeouts[0] = setTimeout(rotClockwise, initialDelay);
	} else if (key == 40) {
		rotAntiClockwise();
		keyTimeouts[1] = setTimeout(rotAntiClockwise, initialDelay);
	} else if (key == 65) {
		keyLeft();
		keyTimeouts[2] = setTimeout(keyLeft, initialDelay);
	} else if (key == 68) {
		keyRight();
		keyTimeouts[3] = setTimeout(keyRight, initialDelay);
	} else if (key == 83) {
		softDrop();
		keyTimeouts[4] = setTimeout(softDrop, initialDelay);
	} else if (key == 87) {
		hardDrop();
		keyTimeouts[5] = setTimeout(hardDrop, initialDelay);
	}
}

document.onkeyup = function(event) {
	var key = event.keyCode;
	var i = -1;
	if (key == 38) {
		i = 0;
	} else if (key == 40) {
		i = 1;
	} else if (key == 65) {
		i = 2;
	} else if (key == 68) {
		i = 3;
	} else if (key == 83) {
		i = 4;
	} else if (key == 87) {
		i = 5;
	}
	if (i != -1) {
		clearTimeout(keyTimeouts[i]);
		keyTimeouts[i] = null;
	}
}

function rotClockwise() {
	rot(1);
	if (keyTimeouts[0] != null) {
		keyTimeouts[0] = setTimeout(rotClockwise, repeatDelay);
	}
}

function rotAntiClockwise() {
	rot(-1);
	if (keyTimeouts[1] != null) {
		keyTimeouts[1] = setTimeout(rotAntiClockwise, repeatDelay);
	}
}

function keyLeft() {
	if (movePiece(-1, 1)) {
		clearTimeout(timeout);
		timeout = setTimeout(tick, 1000);
		render();
	}
	if (keyTimeouts[2] != null) {
		keyTimeouts[2] = setTimeout(keyLeft, repeatDelay);
	}
}

function keyRight() {
	if (movePiece(1, 1)) {
		clearTimeout(timeout);
		timeout = setTimeout(tick, 1000);
		render();
	}
	if (keyTimeouts[3] != null) {
		keyTimeouts[3] = setTimeout(keyRight, repeatDelay);
	}
}

function softDrop() {
	drop();
	render();
	if (keyTimeouts[4] != null) {
		keyTimeouts[4] = setTimeout(softDrop, repeatDelay);
	}
}

function hardDrop() {
	while (movePiece(0, 2)) {
		render();
	}
	clearTimeout(timeout);
	tick();
	if (timeouts[5] != null) {
		keyTimeouts[5] = setTimeout(softDrop, repeatDelay);
	}
}

function rot(r) {
	piece.rot += r;
	if (piece.rot > 5) {
		piece.rot = 0;
	} else if (piece.rot < 0) {
		piece.rot = 5;
	}
	shape = SHAPES[piece.color][piece.rot];
	for (var i = 0; i < KICKS.length; i++) {
		if (movePiece(KICKS[i][0], KICKS[i][1])) {
			render();
			return;
		}
	}
	piece.rot -= r;
	if (piece.rot > 5) {
		piece.rot = 0;
	} else if (r < 0) {
		piece.rot = 5;
	}
	shape = SHAPES[piece.color][piece.rot];
}

function drop() {
	if (!movePiece(0, 2)) {
		for (i = 0; i < 5; i++) {
			var x = piece.x + shape[i][0];
			var y = piece.y + shape[i][1];
			board[x][y] = piece.color;
		}
		var clear = [];
		var last = false;
		outer:
		for (y = 19; y >= 0; y--) {
			for (x = 0; x < 10; x++) {
				if (board[x][y] == -1 || board == -1) {
					last = false;
					continue outer;
				}
			}
			if (last) {
				last = false;
				clear.push(y + 1);
			} else {
				last = true;
			}
		}
		for (i = 0; i < clear.length; i++) {
			for (y = clear[i] + i * 2; y > 1; y--) {
				for (x = 0; x < 10; x++) {
					board[x][y] = board[x][y - 2];
				}
			}
		}
		if (clear.length > 0) {
			for (x = 0; x < 10; x++) {
				for (y = 0; y < 2; y++) {
					board[x][y] = -1;
				}
			}
		}
		newPiece();
	}
}

function movePiece(ox, oy) {
	piece.y += oy;
	piece.x += ox;
	for (var i = 0; i < 5; i++) {
		var x = piece.x + shape[i][0];
		var y = piece.y + shape[i][1];
		if (y < 0) {
			continue;
		}
		if (x < 0 || x >= 10 || y >= 20 || board[x][y] != -1) {
			piece.y -= oy;
			piece.x -= ox;
			return false;
		}
	}
	return true;
}

function uniform(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function tick() {
	drop();
	render();
	timeout = setTimeout(tick, 1000);
}

function render() {
	var canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	ctx.strokeStyle = "rgb(0, 0, 0)";
	ctx.lineWidth = 2;
	ctx.fillStyle = "#EEEEEE";
	ctx.fillRect(0, 0, 1000, 1000);
	for (i = 0; i < 5; i++) {
		var x = piece.x + shape[i][0];
		var y = piece.y + shape[i][1];
		pathTriangle(x, y);
		ctx.fillStyle = COLORS[piece.color];
		ctx.fill();
	}
	for (x = 0; x < 10; x++) {
		for (y = 0; y < 20; y++) {
			pathTriangle(x, y);
			if (board[x][y] != -1) {
				ctx.fillStyle = COLORS[board[x][y]];
				ctx.fill();
			}
			ctx.stroke();
		}
	}
}

function pathTriangle(x, y) {
	var left = ((x + y) % 2) == 0 ? true : false;
	x *= 55;
	y *= 32;
	if (left) {
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + 55, y + 32);
		ctx.lineTo(x, y + 64);
		ctx.lineTo(x, y);
	} else {
		ctx.beginPath();
		ctx.moveTo(x, y + 32);
		ctx.lineTo(x + 55, y);
		ctx.lineTo(x + 55, y + 64);
		ctx.lineTo(x, y + 32);
	}
}
if (localStorage.getItem("initial")) {
	initialDelay = parseInt(localStorage.getItem("initial"));
}
if (localStorage.getItem("repeat")) {
	repeatDelay = parseInt(localStorage.getItem("repeat"));
}
document.getElementById("initial").value = initialDelay;
document.getElementById("repeat").value = repeatDelay;
clearBoard();
newPiece();
tick();