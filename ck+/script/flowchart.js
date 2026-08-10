// Flowcharts for AI decision trees
const FLOWCHART_PADDING_X = 20;
const FLOWCHART_PADDING_Y = 20;
const FLOWCHART_SPAN_X = 80;
const FLOWCHART_SPAN_Y = 40;
const FLOWCHART_NODE_WIDTH = 120;
const FLOWCHART_NODE_HEIGHT = 90;

const DEBUG_FLOWCHART = {
	"nodes": {
		"a": {
			"type": "start",
			"content": "AI HP",
			"connections": [
				{
					"to": "c",
					"content": ">50%"
				},
				{
					"to": "b",
					"content": "<=50%"
				}
			]
		},
		"b": {
			"type": "score",
			"content": "+1"
		},
		"c": {
			"type": "choice",
			"content": "AI Attack stage",
			"connections": [
				{
					"to": "f",
					"content": "else"
				},
				{
					"to": "d",
					"content": ">=+4"
				},
				{
					"to": "e",
					"content": "+2 or +3"
				}
			]
		},
		"d": {
			"type": "score",
			"content": "+1"
		},
		"e": {
			"type": "score",
			"content": "+0"
		},
		"f": {
			"type": "choice",
			"content": "Is the player's primary type Ghost?",
			"connections": [
				{
					"to": "h",
					"content": "no"
				},
				{
					"to": "g",
					"content": "yes"
				}
			]
		},
		"g": {
			"type": "score",
			"content": "+2"
		},
		"h": {
			"type": "choice",
			"content": "Are either of the player's types special?",
			"connections": [
				{
					"to": "k",
					"content": "no"
				},
				{
					"to": "j",
					"content": "yes"
				}
			]
		},
		"j": {
			"type": "score",
			"content": "+0"
		},
		"k": {
			"type": "score",
			"content": "-2 (80%)"
		}
	}
}

function debugFlowchart() {
	document.getElementById("full-page").innerHTML = `
		<textarea id="debug-flowchart-text" oninput="displayDebugFlowchart()" style="font-size:12px;width:90%;height:400px;"></textarea>
		<div id="debug-flowchart"></div>
	`;
}

function displayDebugFlowchart() {
	document.getElementById("debug-flowchart").innerHTML = createFlowchartDisplay(new ComposedFlowchart(JSON.parse(document.getElementById("debug-flowchart-text").value)));
}

function createFlowchartDisplay(flowchart) {
	var content = "";
	function addNode(type, fx, fy, text) {
		var pos = getFlowchartPos(fx, fy);
		var left = pos.x - (FLOWCHART_NODE_WIDTH / 2);
		var top = pos.y - (FLOWCHART_NODE_HEIGHT / 2);
		content += `
		<div class="flowchart-node flowchart-node-${type}" style="left:${left}px;top:${top}px;">
			${text}
		</div>
		`;
	}
	function addLine(type, sx, sy, ex, ey) {
		var start = getFlowchartPos(sx, sy);
		var end = getFlowchartPos(ex, ey);
		var minX = Math.min(start.x, end.x);
		var minY = Math.min(start.y, end.y);
		content += `
		<div class="flowchart-line" style="left:${minX - 1}px;top:${minY - 1}px;width:${Math.abs(end.x - start.x) + 2}px;height:${Math.abs(end.y - start.y) + 2}px;">
		</div>
		`;
	}
	function addRoute(type, fx, fy, text) {
		var pos = getFlowchartPos(fx, fy);
		content += `
		<div class="flowchart-route" style="left:${pos.x}px;top:${pos.y}px;">
			${text}
		</div>
		`;
	}
	function addSmartLine(conn) {
		if (conn.from.x == conn.to.x || conn.from.y == conn.to.y) {
			addLine("", conn.from.x, conn.from.y, conn.to.x, conn.to.y);
			addRoute("", (conn.from.x + conn.to.x) / 2, (conn.from.y + conn.to.y) / 2, conn.content);
		} else {

		}
	}
	for (const node of flowchart.nodes) {
		addNode(node.type, node.x, node.y, node.content);
		for (const conn of node.connections) {
			addSmartLine(conn);
		}
	}
	return `
	<div class="flowchart-container" style="--flow-height:${flowchart.height};">
		${content}
	</div>`;
}

function getFlowchartPos(x, y) {
	return {
		x: FLOWCHART_PADDING_X + ((FLOWCHART_NODE_WIDTH + FLOWCHART_SPAN_X) * x) + (FLOWCHART_NODE_WIDTH / 2),
		y: FLOWCHART_PADDING_Y + ((FLOWCHART_NODE_HEIGHT + FLOWCHART_SPAN_Y) * y) + (FLOWCHART_NODE_HEIGHT / 2)
	};
}

class ComposedFlowchart {
	#nodesById = new Map();
	/**
	 * @type ComposedFlowNode[]
	 */
	nodes = [];
	/**
	 * @type int
	 */
	width;
	/**
	 * @type int
	 */
	height;

	constructor(obj) {
		for (const k of Object.keys(obj.nodes)) {
			var node = new ComposedFlowNode(k, obj.nodes[k]);
			this.nodes.push(node);
			this.#nodesById.set(k, node);
		}
		for (const node of this.nodes) {
			node.compose(this);
		}
		this.layout();
	}

	layout() {
		const PLACEMENT_OFFSETS = [
			{ x: 0, y: 1 },
			{ x: -1, y: 0 },
			{ x: 1, y: 0 },
			{ x: -1, y: 1 },
			{ x: 1, y: 1 },
			{ x: -2, y: 0 },
			{ x: 2, y: 0 },
		];
		var bounds = {
			x: { min: 0, max: 0 },
			y: { min: 0, max: 0 }
		};
		var root = this.nodes[0];
		root.x = 0;
		root.y = 0;
		var workStack = [root];
		var placed = new Set();
		var occupied = new Set();
		placed.add(root);
		occupied.add("0,0");
		while (workStack.length > 0) {
			var item = workStack.pop();
			var at = { x: item.x, y: item.y };
			connectionLoop:
			for (const conn of item.connections) {
				var to = conn.to;
				if (!placed.has(to)) {
					placed.add(to);
					for (const offset of PLACEMENT_OFFSETS) {
						var loc = { x: at.x + offset.x, y: at.y + offset.y };
						var sig = `${loc.x},${loc.y}`;
						if (!occupied.has(sig)) {
							if (loc.x < bounds.x.min) {
								bounds.x.min = loc.x
							} else if (loc.x > bounds.x.max) {
								bounds.x.max = loc.x;
							}
							if (loc.y < bounds.y.min) {
								bounds.y.min = loc.y
							} else if (loc.y > bounds.y.max) {
								bounds.y.max = loc.y;
							}
							to.x = loc.x;
							to.y = loc.y;
							occupied.add(sig);
							workStack.push(to);
							continue connectionLoop;
						}
					}
					console.error("Ran out of placement offsets trying to layout flowchart!");
				}
			}
		}
		for (const node of this.nodes) {
			node.x -= bounds.x.min;
			node.y -= bounds.y.min;
		}
		this.width = bounds.x.max - bounds.x.min + 1
		this.height = bounds.y.max - bounds.y.min + 1
	}

	// Mirror diagonally
	transpose() {
		for (const node of this.nodes) {
			var temp = node.x;
			node.x = node.y;
			node.y = temp;
		}
		var temp = this.width;
		this.width = this.height;
		this.height = temp;
	}

	/**
	 * @return ComposedFlowNode
	 */
	getNode(id) {
		return this.#nodesById.get(id);
	}
}

class ComposedFlowNode {
	/**
	 * @type int
	 */
	x;
	/**
	 * @type int
	 */
	y;
	/**
	 * @type string
	 */
	name;
	/**
	 * @type string
	 */
	type;
	content;
	/**
	 * @type ComposedFlowConnection[]
	 */
	connections;

	constructor(name, obj) {
		this.name = name;
		this.type = obj.type;
		this.content = obj.content;
		this.connections = (obj.connections ?? []).map(v => new ComposedFlowConnection(this, v));
	}

	/**
	 * @param flowchart ComposedFlowchart
	 */
	compose(flowchart) {
		for (const connection of this.connections) {
			connection.compose(flowchart);
		}
	}
}

class ComposedFlowConnection {
	/**
	 * @type ComposedFlowNode
	 */
	from;
	/**
	 * @type ComposedFlowNode
	 */
	to;
	content;

	constructor(from, obj) {
		this.from = from;
		this.content = obj.content;
		this.toId = obj.to;
	}

	/**
	 * @param flowchart ComposedFlowchart
	 */
	compose(flowchart) {
		if (this.toId) {
			this.to = flowchart.getNode(this.toId);
			delete this.toId;
		}
	}
}
