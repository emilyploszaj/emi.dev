class Point {
	constructor(col, row) {
		this.col = col;
		this.row = row;
	}

	static of(col, row) {
		if (col < 0 || row < 0 || col >= 8 || row >= 8) {
			return new Point(col, row);
		}
		 if (POINT_CACHE[col][row] == null) {
			POINT_CACHE[col][row] = new Point(col, row);
		}
		return POINT_CACHE[col][row];
	}

	get name() {
		return COL[this.col] + ROW[this.row];
	}

	get element() {
		return document.getElementById(this.name);
	}

	get exists() {
		return !(this.col < 0 || this.row < 0 || this.col >= 8 || this.row >= 8);
	}

	get empty() {
		return this.exists && board.get(this) == null;
	}

	get occupiedColor() {
		if (this.exists) {
			return board.get(this).color;
		}
	}

	off(x, y) {
		return Point.of(this.col + x, this.row + y);
	}
}

class Piece {
	constructor(color, piece, origin) {
		this.color = color;
		this.piece = piece;
		this.origin = origin;
		this.hasMoved = false;
		this.entangled = false;
		this.promoted = false;
		this.ref = {unique: ""};
	}
	
	copy() {
		var p = new Piece(this.color, this.piece, this.origin);
		p.hasMoved = this.hasMoved;
		p.entangled = this.entangled;
		p.promoted = this.promoted;
		p.ref = this.ref;
		return p;
	}

	promote(promoteTo, newUniq) {
		this.piece = promoteTo;
		this.ref = newUniq;
		this.promoted = true;
	}

	getDiv() {
		if (this.entangled) {
			var x = 64 * this.origin;
			if (this.color == 0) {
				x += 64 * 8;
			}
			var y = 192;
			if (this.piece == 0) {
				y -= 64;
			}
			if (this.promoted) {
				y += this.piece * 64;
			}
			return "<div class=\"piece\" style=\"background-position-x:-" + x + "px;background-position-y:-" + y + "px;\"></div>";
		} else {
			return "<div class=\"piece " + COLORS[this.color] + " " + PIECES[this.piece] + "\"></div>";
		}
	}
}

class Board {
	constructor(update) {
		this.lastEnPassantCandidate = null;
		this.update = update;
		this.board = [
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null],
			[null, null, null, null, null, null, null, null]
		]
	}

	get(point) {
		if (point.exists) {
			return this.board[point.col][point.row];
		}
		return null;
	}

	take(point) {
		var piece = this.get(point);
		if (piece != null) {
			if (piece.entangled) {
				for (var c = 0; c < 8; c++) {
					for (var r = 0; r < 8; r++) {
						var p = Point.of(c, r);
						if (p != point && this.get(p) != null && this.get(p).ref == piece.ref) {
							this.set(p, null);
						}
					}
				}
			}
			this.set(point, null);
		}
	}

	set(point, piece) {
		if (point.exists) {
			this.board[point.col][point.row] = piece;
			if (this.update) {
				if (piece == null) {
					point.element.getElementsByClassName("piece-storage")[0].innerHTML = "";
				} else {
					point.element.getElementsByClassName("piece-storage")[0].innerHTML = piece.getDiv();
				}
			}
		}
	}

	performMove(point, moves) {
		var original = this.get(point);
		original.hasMoved = true;
		if (moves.size > 1) {
			original.entangled = true;
		}
		var doPromote = false;
		for (let move of moves) {
			var piece = original.copy();
			this.set(point, null);
			this.take(move.point);
			this.set(move.point, piece);
			this.lastEnPassantCandidate = null;
			if ((move.point.row == 0 || move.point.row == 7) && original.piece == 0) {
				doPromote = true
			}
			if (move.move == 0 && piece.piece == 0) {
				var dist = move.point.row - point.row;
				if (dist > 1 || dist < -1) {
					this.lastEnPassantCandidate = piece;
				}
			} else if (move.move == 2) {
				if (move.point.col == 2) {
					this.get(Point.of(0, point.row)).hasMoved = true;
					this.set(Point.of(3, point.row), this.get(Point.of(0, point.row)));
					this.take(Point.of(0, point.row), null);
				} else {
					this.get(Point.of(7, point.row)).hasMoved = true;
					this.set(Point.of(5, point.row), this.get(Point.of(7, point.row)));
					this.set(Point.of(7, point.row), null);
				}
			} else if (move.move == 3) {
				this.take(move.point.off(0, MOVEMENT[1 - piece.color]));
			}
		}
		if (doPromote) {
			for (var c = 0; c < 8; c++) {
				for (var r = 1; r < 7; r++) {
					var tp = Point.of(c, r);
					if (this.get(tp) != null && this.get(tp).piece == 0
							&& this.get(tp).ref == original.ref) {
						this.set(tp, null);
					}
				}
			}
			var newUniq = {unique: ""}
			for (var c = 0; c < 8; c++) {
				var tp = Point.of(c, original.color * 7);
				if (this.get(tp) != null && this.get(tp).piece == 0) {
					this.get(tp).promote(promoteTo, newUniq);
					board.set(tp, this.get(tp));
				}
			}
		}
		if (isChecked(1 - original.color)) {
			var threatened = getAllThreatened(original.color);
			for (var c = 0; c < 8; c++) {
				for (var r = 0; r < 8; r++) {
					var tp = Point.of(c, r);
					if (this.get(tp) != null && this.get(tp).piece == 5
							&& this.get(tp).color != original.color && !threatened.has(Move.of(tp, 1))) {
						this.set(tp, null);
					}
				}
			}
		}
	}
}

class Move {
	constructor(point, move) {
		this.point = point;
		this.move = move;
	}

	static of(point, move) {
		if (!MOVE_CACHE.has(point)) {
			MOVE_CACHE.set(point, new Map());
		}
		var map = MOVE_CACHE.get(point);
		if (!map.has(move)) {
			map.set(move, new Move(point, move));
		}
		return map.get(move);
	}
}

const POINT_CACHE = [
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null],
	[null, null, null, null, null, null, null, null]
];
const MOVE_CACHE = new Map();
const DISPLAY_COLORS = ["White", "Black"];
const COLORS = ["white", "black"];
const PIECES = ["pawn", "rook", "knight", "bishop", "queen", "king"];
const PIECES_SHORT = ["", "R", "N", "B", "Q", "K"];
const MOVEMENT = [-1, 1];
const ROW = ['8', '7', '6', '5', '4', '3', '2', '1'];
const COL = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
var promoting = false;
var promoteTo = 4;
var queued = new Set();
var swapPoint = null;
var board = new Board(true);
var turn = 0;
var turns = 1;
var myColor = -1;
var local = false;
var started = false;
var dragged = null;

function startGame(c) {
	setBoard();
	addEvents();
	myColor = c;
	if (c == -1) {
		local = true;
		started = true;
	} else if (c == -2) {
		// spectator
	}
}

function parseMove(m) {
	var point = Point.of(m.point.c, m.point.r);
	var moves = new Set();
	var arr = m.moves;
	for (var i = 0; i < arr.length; i++) {
		var mv = arr[i];
		moves.add(Move.of(Point.of(mv.point.c, mv.point.r), mv.move));
	}
	if (m.promote) {
		promoteTo = m.promote;
	} else {
		promoteTo = 4;
	}
	move(point, moves);
}

function sendMove() {
	var obj = {t: "play", point: {c: swapPoint.col, r: swapPoint.row}, moves: []};
	var syncPromotion = false;
	for (let m of queued) {
		if ((m.point.row == 0 || m.point.row == 7) && board.get(swapPoint).piece == 0) {
			syncPromotion = true;
		}
		obj.moves.push({point: {c: m.point.col, r: m.point.row}, move: m.move});
	}
	if (syncPromotion) {
		obj.promote = promoteTo;
	}
	if (!local) {
		socket.send(JSON.stringify(obj));
	}
	parseMove(obj);
}

function setPiece(point, color, piece) {
	board.set(point, new Piece(color, piece, point.col));
}

function setLine(row, color) {
	setPiece(Point.of(0, row), color, 1);
	setPiece(Point.of(7, row), color, 1);
	setPiece(Point.of(1, row), color, 2);
	setPiece(Point.of(6, row), color, 2);
	setPiece(Point.of(2, row), color, 3);
	setPiece(Point.of(5, row), color, 3);
	setPiece(Point.of(3, row), color, 4);
	setPiece(Point.of(4, row), color, 5);
}

function setBoard() {
	for (var c = 0; c < 8; c++) {
		setPiece(Point.of(c, 6), 0, 0);
		setPiece(Point.of(c, 1), 1, 0);
	}
	setLine(7, 0);
	setLine(0, 1);
}

function setPromotion(color, piece) {
	if (color == turn) {
		promoteTo = piece;
		sendMove();
	}
}

function addEvents() {
	document.getElementById("to-white-queen").addEventListener("click", function(event) {
		setPromotion(0, 4);
	});
	document.getElementById("to-white-knight").addEventListener("click", function(event) {
		setPromotion(0, 2);
	});
	document.getElementById("to-white-rook").addEventListener("click", function(event) {
		setPromotion(0, 1);
	});
	document.getElementById("to-white-bishop").addEventListener("click", function(event) {
		setPromotion(0, 3);
	});
	document.getElementById("to-black-queen").addEventListener("click", function(event) {
		setPromotion(1, 4);
	});
	document.getElementById("to-black-knight").addEventListener("click", function(event) {
		setPromotion(1, 2);
	});
	document.getElementById("to-black-rook").addEventListener("click", function(event) {
		setPromotion(1, 1);
	});
	document.getElementById("to-black-bishop").addEventListener("click", function(event) {
		setPromotion(1, 3);
	});
	document.addEventListener("mousemove", function(event) {
		if (dragged != null) {
			document.getElementById("dragged").style.left = event.pageX - 32 + "px";
			document.getElementById("dragged").style.top = event.pageY - 32 + "px";
		} else {
			event.stopPropagation();
		}
	});
	document.addEventListener("mouseup", function(event) {
		if (dragged != null) {
			document.getElementById("dragged").style.display = "none";
			var el = event.target;
			for (var i = 0; i < 10; i++) {
				if (el == null || el.classList == null) {
					break;
				}
				if (el.classList.contains("square")) {
					var id = el.id;
					var c = COL.indexOf(id[0]);
					var r = ROW.indexOf(id[1]);
					selectTarget(Point.of(c, r), true);
				}
				el = el.parentNode;
			}
			var faded = document.getElementsByClassName("hover-faded");
			for (var i = faded.length - 1; i >= 0; i--) {
				faded[i].classList.remove("hover-faded");
			}
			dragged = null;
		}
	});
	for (var row = 0; row < 8; row++) {
		for (var col = 0; col < 8; col++) {
			const p = Point.of(col, row);
			p.element.addEventListener("mousemove", function(event) {
				if (promoting || (myColor != turn && !local)) {
					return;
				}
				if (event.buttons == 1) {
					if (swapPoint == p && dragged == null) {
						dragged = p;
						p.element.classList.add("hover-faded");
						document.getElementById("dragged").style.display = "block";
						document.getElementById("dragged").innerHTML = board.get(p).getDiv();
					}
				}
			});
			p.element.addEventListener("mousedown", function(event) {
				if (myColor != turn && !local) {
					return;
				}
				if (promoting) {
					promoting = false;
					document.getElementById("black-promotion").style.display = "none";
					document.getElementById("white-promotion").style.display = "none";
					return;
				}
				if (swapPoint == null) {
					selectStart(p);
				} else {
					selectTarget(p, false);
				}
			});
		}
	}
}

function selectStart(p) {
	if (p.exists && !p.empty) {
		var piece = board.get(p);
		if (piece.color == turn) {
			var set = getValidMovement(board.get(p), p);
			if (set.size > 0) {
				for (let s of set) {
					if (s.move == 0 || s.move == 2) {
						setTarget(s.point, "destination");
					} else if (s.move == 1 || s.move == 3) {
						setTarget(s.point, "targeted");
					}
				}
				swapPoint = p;
				queued = new Set();
			}
		}
	}
}

function selectTarget(p, immediate) {
	var set = getValidMovement(board.get(swapPoint), swapPoint);
	var doMove = false;
	if (swapPoint == p) {
		doMove = queued.size > 0;
		if (!doMove) {
			return;
		}
	} else {
		for (let s of set) {
			if (s.point.col == p.col && s.point.row == p.row) {
				if (s.move != 0) {
					if (queued.has(s)) {
						queued.delete(s);
						clearTarget(s.point);
						setTarget(s.point, "targeted");
						if (queued.size == 0) {
							clearTarget(swapPoint);
						}
					} else {
						queued.add(s);
						clearTarget(s.point);
						setTarget(s.point, "queued");
						clearTarget(swapPoint);
						setTarget(swapPoint, "confirm");
						doMove = immediate;
					}
					if (!doMove) {
						return;
					}
				} else {
					if (queued.size == 0) {
						queued.add(s);
						doMove = true;
					}
				}
			}
		}
	}
	if (doMove) {
		var piece = board.get(swapPoint);
		if (piece.piece == 0) {
			var amountToPromote = 0;
			var xSum = 0;
			for (let m of queued) {
				if (m.point.row == 0 || m.point.row == 7) {
					xSum += m.point.col * 64;
					amountToPromote++;
				}
			}
			xSum /= amountToPromote;
			if (amountToPromote > 0) {
				if (turn == 0) {
					document.getElementById("white-promotion").style.display = "block";
					document.getElementById("white-promotion").style.paddingLeft = xSum + "px";
				} else {
					document.getElementById("black-promotion").style.display = "block";
					document.getElementById("black-promotion").style.paddingLeft = xSum + "px";
				}
				promoting = true;
				return;
			}
		}
		sendMove();
	}
	swapPoint = null;
	clearTarget({element: document});
	selectStart(p);
}

function setPrevious(point) {
	point.element.innerHTML = "<div class=\"previous\"></div>" + point.element.innerHTML;
}

function setTarget(point, target) {
	point.element.innerHTML = "<div class=\"target " + target + "\"></div>" + point.element.innerHTML;
}

function clearTarget(point) {
	var targets = point.element.getElementsByClassName("target");
	for (var i = targets.length - 1; i >= 0; i--) {
		targets[i].outerHTML = "";
	}
}

function move(point, moves) {
	if (!this.started) {
		return;
	}
	var originalBoard = copyBoard(board);
	var piece = board.get(point);
	var set = getValidMovement(piece, point);
	if (promoteTo < 1 || promoteTo > 4) {
		console.log("Attempted illegal promotion");
		return;
	}
	if (piece == null || piece.color != turn) {
		console.log("Attempted to move an invalid piece");
		return;
	}
	for (let m of moves) {
		if (!set.has(m) || (moves.size > 1 && m.move == 0)) {
			console.log("Illegal move attempted");
			return;
		}
	}
	promoting = false;
	document.getElementById("black-promotion").style.display = "none";
	document.getElementById("white-promotion").style.display = "none";
	board.performMove(point, moves);
	turn = 1 - turn;
	var annot = getAnnotation(originalBoard, point, piece, moves);
	if (turn == 0) {
		var arr = document.getElementById("history").getElementsByTagName("tr");
		arr[arr.length - 1].innerHTML += " <td>" + annot + "</td>";
	} else {
		document.getElementById("history").innerHTML += "<tr><td>" + turns + ")</td><td>" + annot + "</td></tr>";
		turns++;
	}

	var targets = document.getElementsByClassName("previous");
	for (var i = targets.length - 1; i >= 0; i--) {
		targets[i].outerHTML = "";
	}
	setPrevious(point);
	for (let m of moves) {
		setPrevious(m.point);
	}
	swapPoint = null;
	clearTarget({element: document});
}

function getAnnotation(original, point, piece, moves) {
	var text = "";
	var disambiguation = "";
	var promotion = false;
	var updatedBoard = board;
	board = original;
	if (piece.piece != 0) {
		for (var c = 0; c < 8; c++) {
			outer:
			for (var r = 0; r < 8; r++) {
				var p = Point.of(c, r);
				if (p != point) {
					var op = original.get(p);
					if (op != null && op.piece == piece.piece) {
						var set = getValidMovement(op, p);
						for (let move of moves) {
							if (!set.has(move)) {
								continue outer;
							}
						}
						if (point.col != p.col) {
							disambiguation += COL[point.col];
						} else {
							disambiguation += ROW[point.row];
						}
					}
				}
			}
		}
	}
	board = updatedBoard;
	var list = [];
	for (let move of moves) {
		list.push(move);
	}
	list = list.sort(function(a, b) {
		return (a.point.col + a.point.row * 8) - (b.point.col + b.point.row * 8);
	});
	var joiner = ""
	for (let move of list) {
		if ((move.point.row == 0 || move.point.row == 7) && piece.piece == 0) {
			promotion = true;
		}
		if (text == "") {
			text = PIECES_SHORT[piece.piece] + disambiguation;
			if (move.move == 1 || move.move == 3) {
				if (piece.piece == 0) {
					text = COL[point.col];
				}
				text += "x";
			}
			if (move.move == 2) {
				text = "";
			}
		}
		text += joiner;
		if (move.move == 2) {
			if (move.point.col == 2) {
				text += "O-O-O";
			} else {
				text += "O-O";
			}
		} else {
			text += move.point.name;
		}
		joiner = "&";
	}
	if (promotion) {
		text += "=" + PIECES_SHORT[promoteTo];
	}
	if (isChecked(1 - piece.color)) {
		if (isMated(1 - piece.color)) {
			text += "#";
		} else {
			text += "+";
		}
	}
	return text;
}

function isMated(color) {
	if (!isChecked(color)) {
		return false;
	}
	for (var c = 0; c < 8; c++) {
		for (var r = 0; r < 8; r++) {
			var point = Point.of(c, r);
			var piece = board.get(point);
			if (piece != null && piece.color == color && getValidMovement(piece, point).size > 0) {
				return false;
			}
		}
	}
	return true;
}

function isChecked(color) {
	var set = getAllThreatened(1 - color);
	for (let s of set) {
		var piece = board.get(s.point);
		if (piece != null && piece.piece == 5) {
			return true;
		}
	}
	return false;
}

function getAllThreatened(color) {
	var set = new Set();
	for (var c = 0; c < 8; c++) {
		for (var r = 0; r < 8; r++) {
			var point = Point.of(c, r);
			var piece = board.get(point);
			if (piece != null && piece.color == color) {
				getMovement(set, piece, point);
			}
		}
	}
	return set;
}

function copyBoard(original) {
	var nb = new Board(false);
	for (var c = 0; c < 8; c++) {
		for (var r = 0; r < 8; r++) {
			var p = Point.of(c, r);
			if (original.get(p) == null) {
				nb.set(p, null);
			} else {
				nb.set(p, original.get(p).copy());
			}
		}
	}
	return nb;
}

function getValidMovement(piece, point) {
	var res = new Set();
	var set = getMovement(new Set(), piece, point);
	var original = board;
	for (let move of set) {
		if (move.move == 2) {
			board = original;
			if (isChecked(piece.color)) {
				continue;
			}
			board = copyBoard(original);
			if (move.point.col == 2) {
				board.performMove(point, [Move.of(point.off(-1, 0), 0)]);
			} else {
				board.performMove(point, [Move.of(point.off(1, 0), 0)]);
			}
			if (isChecked(piece.color)) {
				continue;
			}
		}
		board = copyBoard(original);
		board.performMove(point, new Set([move]));
		if (!isChecked(piece.color)) {
			res.add(move);
		}
	}
	board = original;
	return res;
}

function getMovement(set, piece, point) {
	if (piece == null) {
		return set;
	}
	if (piece.piece == 0) {
		addNonCapture(set, piece, point.off(0, MOVEMENT[piece.color]));
		addCapture(set, piece, point.off(-1, MOVEMENT[piece.color]));
		addCapture(set, piece, point.off(1, MOVEMENT[piece.color]));
		if (!piece.hasMoved && point.off(0, MOVEMENT[piece.color]).empty) {
			addNonCapture(set, piece, point.off(0, 2 * MOVEMENT[piece.color]));
		}
		if (board.lastEnPassantCandidate != null) {
			if (board.get(point.off(-1, 0)) == board.lastEnPassantCandidate) {
				set.add(Move.of(point.off(-1, MOVEMENT[piece.color]), 3));
			}
			if (board.get(point.off(1, 0)) == board.lastEnPassantCandidate) {
				set.add(Move.of(point.off(1, MOVEMENT[piece.color]), 3));
			}
		}
	} else if (piece.piece == 1) {
		rookMovement(set, piece, point);
	} else if (piece.piece == 2) {
		addMovement(set, piece, point.off(1, 2));
		addMovement(set, piece, point.off(1, -2));
		addMovement(set, piece, point.off(-1, 2));
		addMovement(set, piece, point.off(-1, -2));
		addMovement(set, piece, point.off(2, 1));
		addMovement(set, piece, point.off(-2, 1));
		addMovement(set, piece, point.off(2, -1));
		addMovement(set, piece, point.off(-2, -1));
	} else if (piece.piece == 3) {
		bishopMovement(set, piece, point);
	} else if (piece.piece == 4) {
		rookMovement(set, piece, point);
		bishopMovement(set, piece, point);
	} else if (piece.piece == 5) {
		for (var x = -1; x < 2; x++) {
			for (var y = -1; y < 2; y++) {
				if (x != 0 || y != 0) {
					addMovement(set, piece, point.off(x, y));
				}
			}
		}
		if (!piece.hasMoved) {
			var lr = board.get(point.off(-4, 0));
			var rr = board.get(point.off(3, 0));
			if (lr != null && !lr.hasMoved && board.get(point.off(-1, 0)) == null && board.get(point.off(-2, 0)) == null
					&& board.get(point.off(-3, 0)) == null) {
				set.add(Move.of(point.off(-2, 0), 2));
			}
			if (rr != null && !rr.hasMoved && board.get(point.off(1, 0)) == null && board.get(point.off(2, 0)) == null) {
				set.add(Move.of(point.off(2, 0), 2));
			}
		}
	}
	return set;
}

function rookMovement(set, piece, point) {
	continueMovement(set, piece, point.off(1, 0), 1, 0);
	continueMovement(set, piece, point.off(-1, 0), -1, 0);
	continueMovement(set, piece, point.off(0, 1), 0, 1);
	continueMovement(set, piece, point.off(0, -1), 0, -1);
}

function bishopMovement(set, piece, point) {
	continueMovement(set, piece, point.off(1, 1), 1, 1);
	continueMovement(set, piece, point.off(-1, 1), -1, 1);
	continueMovement(set, piece, point.off(1, -1), 1, -1);
	continueMovement(set, piece, point.off(-1, -1), -1, -1);
}

function continueMovement(set, piece, point, offX, offY) {
	if (point.exists) {
		addMovement(set, piece, point);
		if (point.empty) {
			continueMovement(set, piece, point.off(offX, offY), offX, offY);
		}
	}
}

function addMovement(set, piece, point) {
	addNonCapture(set, piece, point);
	addCapture(set, piece, point);
}

function addNonCapture(set, piece, point) {
	if (point.exists) {
		if (point.empty) {
			set.add(Move.of(point, 0));
		}
	}
}

function addCapture(set, piece, point) {
	if (point.exists) {
		if (!point.empty) {
			var c = point.occupiedColor;
			if (c != piece.color) {
				set.add(Move.of(point, 1));
			}
		}
	}
}

document.getElementById("help").onclick = function(event) {
	document.getElementById("help-menu").style.display = "block";
}

document.getElementById("help-menu").onclick = function(event) {
	document.getElementById("help-menu").style.display = "none";
}

document.getElementById("join").onclick = function(event) {
	socket.send(JSON.stringify({t: "join", id: parseInt(document.getElementById("game-id").value)}));
}

document.getElementById("create").onclick = function(event) {
	socket.send(JSON.stringify({t: "create", size: 2}));
}

document.getElementById("spectate").onclick = function(event) {
	socket.send(JSON.stringify({t: "spectate", id: parseInt(document.getElementById("spectate-id").value)}));
}

document.getElementById("play-local").onclick = function(event) {
	document.getElementById("overlay").style.display = "none";
	document.getElementById("display-id").innerHTML = "Game Id: Local";
	document.getElementById("display-color").innerHTML = "Piece Color: Both";
	startGame(-1);
	socket.close();
}

let socket = new WebSocket("wss://scrabblesweeper.net:9928");

socket.onopen = function(e) {
	socket.send(JSON.stringify({t: "ping"}));
}

socket.onmessage = function(e) {
	console.log(e.data + "");
	var j = JSON.parse(e.data);
	if (j.t == "pong") {
		document.getElementById("loading").style.display = "none";
		document.getElementById("connection").style.display = "block";
	} else if (j.t == "create" || j.t == "join") {
		document.getElementById("overlay").style.display = "none";
		document.getElementById("display-id").innerHTML = "Game Id: " + j.id;
		document.getElementById("display-color").innerHTML = "Piece Color: " + DISPLAY_COLORS[j.player];
		startGame(j.player);
	} else if (j.t == "spectate") {
		document.getElementById("overlay").style.display = "none";
		document.getElementById("display-id").innerHTML = "Game Id: " + j.id;
		document.getElementById("display-color").innerHTML = "Piece Color: Spectating";
		startGame(-2);
	} else if (j.t == "start") {
		this.started = true;
	} else if (j.t == "play") {
		if (turn != myColor) {
			parseMove(j);
		}
	}
}